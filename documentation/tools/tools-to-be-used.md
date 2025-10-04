
# BioQuery — Tool Registry (Input/Output Specifications)

Each tool is defined as a callable component within the model’s orchestration layer.  
Tools may be invoked dynamically by the LLM or manually by users through the chat interface.

---

### 🧾 `create_document`

**Purpose:** Create and store a document artifact.  
**Inputs:**

- `title` _(string)_ — document title
    
- `body` _(string)_ — main textual content
    
- `image_prompt` _(optional string)_ — optional image description to generate accompanying visual
    
- `tags` _(array[string])_ — topic identifiers (e.g., `["microgravity", "stem cells"]`)
    

**Outputs:**

- `doc_id` _(string)_ — unique document identifier
    
- `title` _(string)_
    
- `body` _(string)_
    
- `image_link` _(string | null)_ — URL to generated image
    
- `tags` _(array[string])_
    

---

### 🧾 `update_document`

**Purpose:** Update an existing document artifact.  
**Inputs:**

- `doc_id` _(string)_ — reference to document in DB
    
- `title` _(optional string)_ — updated title
    
- `body` _(optional string)_ — updated content
    
- `tags` _(optional array[string])_ — updated tags
    

**Outputs:**

- `doc_id` _(string)_ — updated document ID
    
- `status` _(string)_ — e.g. `"updated"`
    

---

### 🖼️ `generate_image`

**Purpose:** Generate and store an image via Freepik’s image API.  
**Inputs:**

- `prompt` _(string)_ — description of the image to generate
    
- `show_to_user` _(boolean)_ — whether to display the image inline in chat
    
- `tags` _(array[string])_ — topics related to image
    

**Outputs:**

- `image_uri` _(string)_ — URL to stored image
    
- `tags` _(array[string])_
    
- `show_to_user` _(boolean)_
    

---

### 🧬 `create_knowledge_graph_json`

**Purpose:** Create a structured graph representing relationships in research data.  
**Inputs:**

- `nodes` _(array[object])_ — e.g., `{ id, label, type }`
    
- `edges` _(array[object])_ — e.g., `{ source, target, relation }`
    
- `context` _(optional string)_ — background text or description
    
- `tags` _(array[string])_
    

**Outputs:**

- `graph_json` _(object)_ — valid knowledge graph schema
    
- `tags` _(array[string])_
    

---

### 📊 `create_visual_json`

**Purpose:** Create structured data for visualization.  
**Inputs:**

- `chart_type` _(enum: 'pie' | 'bar' | 'line')_
    
- `data_points` _(array[object])_ — `{ label, value }` pairs
    
- `title` _(string)_
    
- `tags` _(array[string])_
    

**Outputs:**

- `visual_json` _(object)_ — structured dataset
    
- `chart_type` _(string)_
    
- `tags` _(array[string])_
    

---

### 🖼️ `analyze_image`

**Purpose:** Extract and interpret information from an uploaded image.  
**Inputs:**

- `image_uri` _(string)_  
    **Outputs:**
    
- `analysis` _(string)_ — textual interpretation
    

---

### 📄 `analyze_document`

**Purpose:** Analyze uploaded documents (PDF, TXT, DOCX) for insights.  
**Inputs:**

- `file_uri` _(string)_
    
- `analysis_goal` _(optional string)_ — e.g. “summarize results section”  
    **Outputs:**
    
- `summary` _(string)_
    
- `key_findings` _(array[string])_
    

---

### 🕰️ `timeline_builder`

**Purpose:** Generate a visual narrative or timeline.  
**Inputs:**

- `title` _(string)_
    
- `timeline_sections` _(array[object])_ — each with `{ title, description, image_prompt }`
    
- `tags` _(array[string])_
    

**Outputs:**

- `timeline_json` _(object)_ — array of `{ section_title, image_link, description }`
    
- `tags` _(array[string])_
    

---

### 🔍 `contextual_search`

**Purpose:** Perform semantic retrieval from pgvector store.  
**Inputs:**

- `query` _(string)_
    
- `top_k` _(integer, default=5)_  
    **Outputs:**
    
- `results` _(array[object])_ — `{ title, text, url, similarity_score }`
    

---

### 💬 `answer_with_sources`

**Purpose:** Generate a RAG-based answer with references.  
**Inputs:**

- `query` _(string)_
    
- `contextual_results` _(optional array)_ — can be passed from `contextual_search`  
    **Outputs:**
    
- `answer` _(string)_
    
- `sources` _(array[string])_ — reference URLs or PMCIDs
    

---

### 🌍 `translate_publication`

**Purpose:** Translate a document or text snippet to another language.  
**Inputs:**

- `text` _(string)_
    
- `target_lang` _(string, e.g., 'fr', 'es', 'de')_  

- `doc_uri` _(string); the URL of the document it processed_

    **Outputs:**
    
- `translated_text` _(string)_
    
- `detected_language` _(string)_

- `doc_uri` _(string); the URL of the document that was processed_    

---

## 🔹 Thoughts

The tools work together like this:

|Stage|Example Tools|
|---|---|
|**Preprocessing**|`analyze_document`, `analyze_image`|
|**Retrieval / RAG**|`contextual_search`, `answer_with_sources`|
|**Artifact Creation**|`create_document`, `update_document`, `timeline_builder`, `create_visual_json`, `create_knowledge_graph_json`|
|**Presentation / Extension**|`generate_image`, `translate_publication`|

This gives you a **modular, composable** AI system — you can build workflows like:

> “User uploads a doc → `analyze_document` → `create_knowledge_graph_json` → `generate_image` → `create_document` (summary artifact) → `pin_to_dashboard`.”

The model's system prompts can be crafted to use this structure easy with proper co-ordination
