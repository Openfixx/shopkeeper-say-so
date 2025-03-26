
# Custom spaCy NER Model for Voice Commands

This document explains how to train and use a custom spaCy Named Entity Recognition (NER) model for processing voice commands related to retail inventory management.

## Requirements

To train the model, you'll need:

```
# Install these requirements
pip install spacy==3.6.1
pip install indic-nlp-library  # Optional for Hindi preprocessing
python -m spacy download en_core_web_sm
```

These requirements are listed in `requirements.txt` at the root of this repository.

## Training Data Format

The training data consists of examples of voice commands along with annotated entities:

```python
TRAIN_DATA = [
    ("add 5 kg sugar to rack 3 and it's price is ₹30", 
     {"entities": [(4, 9, "QUANTITY"), (10, 15, "PRODUCT_NAME"), (19, 25, "LOCATION"), (41, 44, "PRICE")]}),

    ("5 kg sugar on rack 3 is priced ₹30", 
     {"entities": [(0, 5, "QUANTITY"), (6, 11, "PRODUCT_NAME"), (15, 21, "LOCATION"), (30, 33, "PRICE")]}),

    # Hindi Examples
    ("5 किलो चीनी रैक 3 में रख दो और इसका दाम ₹30 है", 
     {"entities": [(0, 7, "QUANTITY"), (8, 12, "PRODUCT_NAME"), (13, 18, "LOCATION"), (30, 33, "PRICE")]}),

    ("7 लीटर दूध की कीमत ₹50 है", 
     {"entities": [(0, 8, "QUANTITY"), (9, 12, "PRODUCT_NAME"), (19, 22, "PRICE")]}),
]
```

## Training Script

Use the following script to train your custom NER model:

```python
import spacy
from spacy.training.example import Example
from spacy.util import minibatch

# Create a blank spaCy model
nlp = spacy.blank("en")  
ner = nlp.add_pipe("ner")

# Add entity labels
for _, annotations in TRAIN_DATA:
    for ent in annotations["entities"]:
        ner.add_label(ent[2])

# Training Loop
optimizer = nlp.begin_training()
for i in range(10):  # Train for 10 iterations
    losses = {}
    for text, annotations in TRAIN_DATA:
        example = Example.from_dict(nlp.make_doc(text), annotations)
        nlp.update([example], drop=0.5, losses=losses)
    print(f"Iteration {i}, Losses: {losses}")

# Save the trained model
nlp.to_disk("custom_ner_model")
```

## Using the Trained Model

Once you've trained the model, you can use it for prediction:

```python
import spacy

# Load trained model
nlp = spacy.load("custom_ner_model")

# Process text
text = "add 2 kg salt to rack 5 price is ₹20"
doc = nlp(text)

# Extract entities
entities = [(ent.text, ent.label_, ent.start_char, ent.end_char) for ent in doc.ents]
print(entities)
```

## Integration with Web Application

To integrate the trained model with the web application:

1. Host the spaCy model on a backend server (Python)
2. Create an API endpoint that accepts text and returns processed entities
3. Call this API from the frontend when processing voice commands

Alternatively, you could use the edge function approach implemented in this project, which offers a lightweight rule-based alternative when a full spaCy model is not available.

## Multi-language Support

The current implementation supports basic English and Hindi commands. To enhance multi-language support:

1. Add more training examples in different languages
2. Use language-specific preprocessing (e.g., indic-nlp-library for Indian languages)
3. Consider training separate models for each language or using a multilingual model
