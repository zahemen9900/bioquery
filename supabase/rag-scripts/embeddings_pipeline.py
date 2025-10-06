# fetch the publications from their public URL. this extraction was done in a colab environment, but the code has been copied here to understand how the data was extracted and structired.

import csv
import json
import requests
from bs4 import BeautifulSoup
import time
import re
from urllib.parse import urlparse

# --- Config ---
INPUT_CSV = "/content/publications.csv"
OUTPUT_JSONL = "/content/publications.jsonl"
NCBI_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"


def extract_pmcid(url: str):
    """
    Extracts PMCID from a PMC article URL.
    Example: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4136787/ -> 4136787
    """
    parsed = urlparse(url)
    match = re.search(r"PMC(\d+)", parsed.path)
    return match.group(1) if match else None


def fetch_article_xml(pmcid: str):
    """
    Fetch full-text XML from PMC using efetch.
    """
    params = {
        "db": "pmc",
        "id": pmcid,
        "retmode": "xml"
    }
    resp = requests.get(NCBI_BASE, params=params)
    if resp.status_code == 200:
        return resp.text
    else:
        print(f"Failed to fetch PMCID {pmcid}: {resp.status_code}")
        return None


def parse_article(xml_text: str):
    """
    Parse XML to extract Title, Abstract, and main sections.
    """
    soup = BeautifulSoup(xml_text, "lxml-xml")

    title = soup.find("article-title")
    title = title.get_text(strip=True) if title else "Untitled"

    abstract = " ".join([p.get_text(" ", strip=True) for p in soup.find_all("abstract")]) or None

    # Extract section-wise text (Results, Discussion, Conclusion, etc.)
    sections = {}
    for sec in soup.find_all("sec"):
        label = sec.find("title")
        if label:
            sec_title = label.get_text(strip=True).lower()
            sec_text = " ".join([p.get_text(" ", strip=True) for p in sec.find_all("p")])
            sections[sec_title] = sec_text

    return {
        "title": title,
        "abstract": abstract,
        "sections": sections
    }


def main():
    with open(INPUT_CSV, "r", encoding="utf-8") as f, open(OUTPUT_JSONL, "w", encoding="utf-8") as out_f:
        reader = csv.DictReader(f)
        for row in reader:
            pmcid = extract_pmcid(row["Link"])
            if not pmcid:
                print(f"Could not extract PMCID from {row['Link']}")
                continue

            xml_text = fetch_article_xml(pmcid)
            if not xml_text:
                continue

            article_data = parse_article(xml_text)
            article_data["url"] = row["Link"]
            article_data["pmcid"] = pmcid

            # Save to JSONL
            out_f.write(json.dumps(article_data) + "\n")
            print(f"Saved {article_data['title']}")

            time.sleep(0.3)  # be nice to NCBI servers


if __name__ == "__main__":
    main()



# Then the next set of scripts to process this dataset into a set of embeddings for RAG is below:
import cohere
import json
import os
import time
from tqdm import tqdm

# --- Config ---
INPUT_JSONL = "/content/publications.jsonl"
OUTPUT_JSONL = "/content/publications_with_cohere_v4_embeddings.jsonl"
MODEL = "embed-v4.0"
DIM = 512  # smaller dimension speeds up and is cheaper
BATCH_SIZE = 20
SLEEP_BETWEEN_BATCHES = 0.5

co = cohere.ClientV2(api_key="wGUrVZPBobIKlYQDkFyyF2zKUjMD9VWSzImOyFlx")

def chunk_text(text, max_words=200):
    """Split into chunks ~200 words (≈250–300 tokens)."""
    if not text:
        return []
    words = text.split()
    chunks = []
    for i in range(0, len(words), max_words):
        chunks.append(" ".join(words[i:i+max_words]))
    return chunks

def embed_with_retry(chunks, input_type="search_document"):
    """Embed with retry logic for 429 errors."""
    while True:
        try:
            res = co.embed(
                model=MODEL,
                texts=chunks,
                input_type=input_type,
                output_dimension=DIM,
                embedding_types=["float"]
            )
            return res.embeddings.float
        except cohere.TooManyRequestsError:
            print("⚠️ Rate limit hit. Sleeping 10s before retry...")
            time.sleep(10)

def main():
    # --- Load already processed IDs for resume ---
    done_pmcs = set()
    if os.path.exists(OUTPUT_JSONL):
        with open(OUTPUT_JSONL, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    rec = json.loads(line)
                    done_pmcs.add(rec["pmcid"])
                except:
                    continue
    print(f"Resuming: {len(done_pmcs)} docs already embedded.")

    with open(INPUT_JSONL, "r", encoding="utf-8") as infile, \
         open(OUTPUT_JSONL, "a", encoding="utf-8") as outfile:

        for line in tqdm(infile, desc="Embedding docs"):
            article = json.loads(line)
            pmcid = article.get("pmcid")

            # skip already processed docs
            if pmcid in done_pmcs:
                continue

            # collect chunks
            chunks = []
            if article.get("abstract"):
                chunks.extend(chunk_text(article["abstract"]))
            for sec_text in article.get("sections", {}).values():
                chunks.extend(chunk_text(sec_text))

            if not chunks:
                continue

            # batch processing
            for i in range(0, len(chunks), BATCH_SIZE):
                batch = chunks[i:i+BATCH_SIZE]
                embeddings = embed_with_retry(batch)

                for j, (chunk, emb) in enumerate(zip(batch, embeddings)):
                    record = {
                        "pmcid": pmcid,
                        "title": article.get("title"),
                        "url": article.get("url"),
                        "chunk_index": i + j,
                        "text": chunk,
                        "embedding": emb
                    }
                    outfile.write(json.dumps(record) + "\n")

                time.sleep(SLEEP_BETWEEN_BATCHES)

    print(f"✅ Embeddings saved (resume supported) → {OUTPUT_JSONL}")

if __name__ == "__main__":
    main()

