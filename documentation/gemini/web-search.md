 Grounding with Google Search

Grounding with Google Search connects the Gemini model to real-time web content and works with all available languages. This allows Gemini to provide more accurate answers and cite verifiable sources beyond its knowledge cutoff.

Grounding helps you build applications that can:

    Increase factual accuracy: Reduce model hallucinations by basing responses on real-world information.
    Access real-time information: Answer questions about recent events and topics.

    Provide citations: Build user trust by showing the sources for the model's claims.

```ts
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

const groundingTool = {
  googleSearch: {},
};

const config = {
  tools: [groundingTool],
};

const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: "Who won the euro 2024?",
  config,
});

console.log(response.text);

```


## Understanding the Grounding Response
When a response is successfully grounded, the response includes a groundingMetadata field. This structured data is essential for verifying claims and building a rich citation experience in your application.


```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "Spain won Euro 2024, defeating England 2-1 in the final. This victory marks Spain's record fourth European Championship title."
          }
        ],
        "role": "model"
      },
      "groundingMetadata": {
        "webSearchQueries": [
          "UEFA Euro 2024 winner",
          "who won euro 2024"
        ],
        "searchEntryPoint": {
          "renderedContent": "<!-- HTML and CSS for the search widget -->"
        },
        "groundingChunks": [
          {"web": {"uri": "https://vertexaisearch.cloud.google.com.....", "title": "aljazeera.com"}},
          {"web": {"uri": "https://vertexaisearch.cloud.google.com.....", "title": "uefa.com"}}
        ],
        "groundingSupports": [
          {
            "segment": {"startIndex": 0, "endIndex": 85, "text": "Spain won Euro 2024, defeatin..."},
            "groundingChunkIndices": [0]
          },
          {
            "segment": {"startIndex": 86, "endIndex": 210, "text": "This victory marks Spain's..."},
            "groundingChunkIndices": [0, 1]
          }
        ]
      }
    }
  ]
}

```

## Attributing Sources with inline Citations
The API returns structured citation data, giving you complete control over how you display sources in your user interface. You can use the groundingSupports and groundingChunks fields to link the model's statements directly to their sources. Here is a common pattern for processing the metadata to create a response with inline, clickable citations.

```ts
function addCitations(response) {
    let text = response.text;
    const supports = response.candidates[0]?.groundingMetadata?.groundingSupports;
    const chunks = response.candidates[0]?.groundingMetadata?.groundingChunks;

    // Sort supports by end_index in descending order to avoid shifting issues when inserting.
    const sortedSupports = [...supports].sort(
        (a, b) => (b.segment?.endIndex ?? 0) - (a.segment?.endIndex ?? 0),
    );

    for (const support of sortedSupports) {
        const endIndex = support.segment?.endIndex;
        if (endIndex === undefined || !support.groundingChunkIndices?.length) {
        continue;
        }

        const citationLinks = support.groundingChunkIndices
        .map(i => {
            const uri = chunks[i]?.web?.uri;
            if (uri) {
            return `[${i + 1}](${uri})`;
            }
            return null;
        })
        .filter(Boolean);

        if (citationLinks.length > 0) {
        const citationString = citationLinks.join(", ");
        text = text.slice(0, endIndex) + citationString + text.slice(endIndex);
        }
    }

    return text;
}

const textWithCitations = addCitations(response);
console.log(textWithCitations);

```

# URL context

The URL context tool lets you provide additional context to the models in the form of URLs. By including URLs in your request, the model will access the content from those pages (as long as it's not a URL type listed in the limitations section) to inform and enhance its response.

The URL context tool is useful for tasks like the following:

    Extract Data: Pull specific info like prices, names, or key findings from multiple URLs.
    Compare Documents: Analyze multiple reports, articles, or PDFs to identify differences and track trends.
    Synthesize & Create Content: Combine information from several source URLs to generate accurate summaries, blog posts, or reports.
    Analyze Code & Docs: Point to a GitHub repository or technical documentation to explain code, generate setup instructions, or answer questions.

The following example shows how to compare two recipes from different websites.

```ts

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
        "Compare the ingredients and cooking times from the recipes at https://www.foodnetwork.com/recipes/ina-garten/perfect-roast-chicken-recipe-1940592 and https://www.allrecipes.com/recipe/21151/simple-whole-roast-chicken/",
    ],
    config: {
      tools: [{urlContext: {}}],
    },
  });
  console.log(response.text);

  // For verification, you can inspect the metadata to see which URLs the model retrieved
  console.log(response.candidates[0].urlContextMetadata)
}

await main();

```

## How it works

The URL Context tool uses a two-step retrieval process to balance speed, cost, and access to fresh data. When you provide a URL, the tool first attempts to fetch the content from an internal index cache. This acts as a highly optimized cache. If a URL is not available in the index (for example, if it's a very new page), the tool automatically falls back to do a live fetch. This directly accesses the URL to retrieve its content in real-time.
Combining with other tools

You can combine the URL context tool with other tools to create more powerful workflows.
Grounding with search
When both URL context and Grounding with Google Search are enabled, the model can use its search capabilities to find relevant information online and then use the URL context tool to get a more in-depth understanding of the pages it finds. This approach is powerful for prompts that require both broad searching and deep analysis of specific pages.

```ts
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
        "Give me three day events schedule based on YOUR_URL. Also let me know what needs to taken care of considering weather and commute.",
    ],
    config: {
      tools: [
        {urlContext: {}},
        {googleSearch: {}}
        ],
    },
  });
  console.log(response.text);
  // To get URLs retrieved for context
  console.log(response.candidates[0].urlContextMetadata)
}

await main();

```


### Understanding the response

When the model uses the URL context tool, the response includes a url_context_metadata object. This object lists the URLs the model retrieved content from and the status of each retrieval attempt, which is useful for verification and debugging.

The following is an example of that part of the response (parts of the response have been omitted for brevity):

```json

{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "... \n"
          }
        ],
        "role": "model"
      },
      ...
      "url_context_metadata": {
        "url_metadata": [
          {
            "retrieved_url": "https://www.foodnetwork.com/recipes/ina-garten/perfect-roast-chicken-recipe-1940592",
            "url_retrieval_status": "URL_RETRIEVAL_STATUS_SUCCESS"
          },
          {
            "retrieved_url": "https://www.allrecipes.com/recipe/21151/simple-whole-roast-chicken/",
            "url_retrieval_status": "URL_RETRIEVAL_STATUS_SUCCESS"
          }
        ]
      }
    }
}
```