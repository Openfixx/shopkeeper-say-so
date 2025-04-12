
# Training a Custom spaCy NER Model for ShopKeeper Voice Commands

This document explains how to train a custom spaCy Named Entity Recognition (NER) model for the ShopKeeper app to better recognize inventory-related entities from voice commands.

## Prerequisites

```bash
# Install required Python packages
pip install spacy==3.6.1
pip install indic-nlp-library==0.92  # For Hindi language support
pip install whisper-openai==20231117  # For audio transcription
```

## 1. Prepare Training Data

Create a file named `train_data.py` with labeled examples:

```python
TRAIN_DATA = [
    # English Examples
    ("add 5 kg sugar to rack 3 and it's price is ₹30", 
     {"entities": [(4, 9, "QUANTITY"), (10, 15, "PRODUCT"), (19, 25, "POSITION"), (41, 44, "PRICE")]}),

    ("5 kg sugar on rack 3 is priced ₹30", 
     {"entities": [(0, 5, "QUANTITY"), (6, 11, "PRODUCT"), (15, 21, "POSITION"), (30, 33, "PRICE")]}),
     
    ("put 2 liters milk in shelf 5 costing rupees 60",
     {"entities": [(4, 13, "QUANTITY"), (14, 18, "PRODUCT"), (22, 29, "POSITION"), (38, 49, "PRICE")]}),
     
    ("add 10 packets of salt price 15 rupees expiry date June 2025",
     {"entities": [(4, 14, "QUANTITY"), (18, 22, "PRODUCT"), (23, 34, "PRICE"), (35, 58, "DATE")]}),
     
    ("create bill for 3 kg rice and 2 packets of tea",
     {"entities": [(16, 21, "QUANTITY"), (22, 26, "PRODUCT"), (31, 40, "QUANTITY"), (44, 47, "PRODUCT")]}),

    # Hindi Examples
    ("5 किलो चीनी रैक 3 में रख दो और इसका दाम ₹30 है", 
     {"entities": [(0, 7, "QUANTITY"), (8, 12, "PRODUCT"), (13, 18, "POSITION"), (36, 39, "PRICE")]}),

    ("7 लीटर दूध की कीमत ₹50 है", 
     {"entities": [(0, 8, "QUANTITY"), (9, 12, "PRODUCT"), (23, 26, "PRICE")]}),
     
    ("2 पैकेट आटा शेल्फ 2 में रखें मूल्य ₹25",
     {"entities": [(0, 7, "QUANTITY"), (8, 11, "PRODUCT"), (12, 19, "POSITION"), (26, 31, "PRICE")]}),
     
    ("बिल बनाओ 2 किलो प्याज और 1 किलो आलू",
     {"entities": [(9, 16, "QUANTITY"), (17, 21, "PRODUCT"), (26, 33, "QUANTITY"), (34, 37, "PRODUCT")]}),
]
```

## 2. Train the spaCy Model

Create a file named `train_model.py`:

```python
import spacy
from spacy.training.example import Example
import random
from train_data import TRAIN_DATA

# Create a blank model
nlp = spacy.blank("en")  # For English
# For Hindi: nlp = spacy.blank("hi")

# Add NER component
ner = nlp.add_pipe("ner")

# Add entity labels
for _, annotations in TRAIN_DATA:
    for ent in annotations.get("entities"):
        ner.add_label(ent[2])

# Train the model
optimizer = nlp.begin_training()
for i in range(30):  # 30 iterations
    random.shuffle(TRAIN_DATA)
    losses = {}
    for text, annotations in TRAIN_DATA:
        example = Example.from_dict(nlp.make_doc(text), annotations)
        nlp.update([example], drop=0.5, losses=losses)
    print(f"Iteration {i}, Losses: {losses}")

# Save the model
nlp.to_disk("./shopkeeper_ner_model")
print("Model training complete!")
```

## 3. Test the Model

Create a file named `test_model.py`:

```python
import spacy

# Load the trained model
nlp = spacy.load("./shopkeeper_ner_model")

# Test with new sentences
test_texts = [
    "add 3 boxes of coffee at rack 7 price ₹120",
    "put 500 grams of garlic in drawer 2",
    "bill 2 kg potatoes and 1 kg onions",
    "1 लीटर तेल की कीमत ₹140"  # Hindi: "1 liter oil price ₹140"
]

for text in test_texts:
    doc = nlp(text)
    print(f"\nText: {text}")
    print("Entities:")
    for ent in doc.ents:
        print(f"  {ent.text} - {ent.label_}")
```

## 4. Integration with the ShopKeeper App

To integrate the model with the app, you need to:

1. Host the model on a server that can process API requests
2. Set up a Supabase Edge Function that calls this service
3. Update the frontend to use the enhanced NLP capabilities

### Server API Example (with Flask)

```python
from flask import Flask, request, jsonify
import spacy

app = Flask(__name__)
nlp = spacy.load("./shopkeeper_ner_model")

@app.route('/process', methods=['POST'])
def process_text():
    data = request.json
    text = data.get('text', '')
    
    if not text:
        return jsonify({"error": "No text provided"}), 400
    
    doc = nlp(text)
    entities = []
    
    for ent in doc.ents:
        entities.append({
            "text": ent.text,
            "label": ent.label_,
            "start": ent.start_char,
            "end": ent.end_char
        })
    
    return jsonify({
        "text": text,
        "entities": entities
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

## 5. For Voice Recognition

For speech-to-text capabilities, you can use Whisper OpenAI:

```python
import whisper

model = whisper.load_model("base")  # Options: tiny, base, small, medium, large

def transcribe_audio(audio_file):
    result = model.transcribe(audio_file)
    return result["text"]

# Example usage
text = transcribe_audio("sample_audio.mp3")
print(f"Transcription: {text}")

# Process with NER model
doc = nlp(text)
for ent in doc.ents:
    print(f"{ent.text} - {ent.label_}")
```

## Best Practices

1. Include plenty of examples with different sentence structures
2. Include examples in all supported languages
3. Regularly update the model with new examples
4. Implement fallback mechanisms in the app for when entity recognition fails
5. Consider using language detection to apply the appropriate model
