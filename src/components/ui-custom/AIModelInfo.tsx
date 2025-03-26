
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Brain, Cpu, Mic, FileCode, Code2 } from 'lucide-react';

const AIModelInfo: React.FC = () => {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <CardTitle>AI Model Integration</CardTitle>
        </div>
        <CardDescription>
          Information about the NLP and voice recognition models used in this application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="whisper">
            <AccordionTrigger className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              <span>Whisper Voice Recognition</span>
              <Badge className="ml-auto" variant="outline">Edge Function</Badge>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 p-2">
                <p className="text-sm">
                  OpenAI's Whisper is a state-of-the-art speech recognition model that can transcribe speech in multiple languages.
                </p>
                <div className="bg-muted p-2 rounded-md text-xs">
                  <p className="font-semibold">Integration Status:</p>
                  <p>A serverless edge function simulates integration with Whisper. For production use, this would connect to a deployed Whisper model.</p>
                </div>
                <div className="bg-muted/50 p-2 rounded-md text-xs mt-2">
                  <p className="font-semibold">Command:</p>
                  <code className="text-xs">whisper audio.mp3 --model base</code>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="spacy">
            <AccordionTrigger className="flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              <span>spaCy NLP Processing</span>
              <Badge className="ml-auto" variant="outline">Custom Model</Badge>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 p-2">
                <p className="text-sm">
                  spaCy is an industrial-strength NLP library that provides named entity recognition (NER) to extract structured information from text.
                </p>
                <div className="bg-muted p-2 rounded-md text-xs">
                  <p className="font-semibold">Integration Status:</p>
                  <p>Currently using a rule-based NER implementation. For better results, train a custom spaCy model using the provided training data.</p>
                </div>
                <div className="bg-muted/50 p-2 rounded-md text-xs mt-2">
                  <p className="font-semibold">Setup:</p>
                  <code className="text-xs">
                    pip install spacy<br />
                    python -m spacy download en_core_web_sm<br />
                    pip install indic-nlp-library # For Hindi support
                  </code>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="training">
            <AccordionTrigger className="flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              <span>Training Data</span>
              <Badge className="ml-auto" variant="outline">Python</Badge>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 p-2">
                <p className="text-sm">
                  Example training data for custom NER model to recognize inventory-related entities in voice commands.
                </p>
                <div className="bg-muted p-2 rounded-md text-xs font-mono overflow-x-auto">
                  <p>TRAIN_DATA = [</p>
                  <p className="pl-4">("add 5 kg sugar to rack 3 and it's price is ₹30", </p>
                  <p className="pl-4">{"{"}"entities": [(4, 9, "QUANTITY"), (10, 15, "PRODUCT_NAME"), (19, 25, "LOCATION"), (41, 44, "PRICE")]{"}"}</p>
                  <p>]</p>
                </div>
                <p className="text-xs mt-2">See <code>docs/custom-spacy-model.md</code> for complete documentation.</p>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="code">
            <AccordionTrigger className="flex items-center gap-2">
              <Code2 className="h-4 w-4" />
              <span>Training Code</span>
              <Badge className="ml-auto" variant="outline">Python</Badge>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 p-2">
                <p className="text-sm">
                  Python code for training a custom spaCy NER model with the provided training data.
                </p>
                <div className="bg-muted p-2 rounded-md text-xs font-mono overflow-x-auto">
                  <p>import spacy</p>
                  <p>from spacy.training.example import Example</p>
                  <p>from spacy.util import minibatch</p>
                  <p className="mt-2"># Create a blank spaCy model</p>
                  <p>nlp = spacy.blank("en")</p>
                  <p>ner = nlp.add_pipe("ner")</p>
                  <p className="mt-2"># Add entity labels</p>
                  <p>for _, annotations in TRAIN_DATA:</p>
                  <p className="pl-4">for ent in annotations["entities"]:</p>
                  <p className="pl-8">ner.add_label(ent[2])</p>
                  <p className="mt-2"># Training Loop</p>
                  <p>optimizer = nlp.begin_training()</p>
                  <p>for i in range(10):</p>
                  <p className="pl-4">losses = {"{}"}</p>
                  <p className="pl-4">for text, annotations in TRAIN_DATA:</p>
                  <p className="pl-8">example = Example.from_dict(nlp.make_doc(text), annotations)</p>
                  <p className="pl-8">nlp.update([example], drop=0.5, losses=losses)</p>
                  <p className="mt-2"># Save the trained model</p>
                  <p>nlp.to_disk("custom_ner_model")</p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        <p>For full implementation, you would need to deploy a Python backend service that hosts the trained spaCy model and Whisper for audio transcription.</p>
      </CardFooter>
    </Card>
  );
};

export default AIModelInfo;
