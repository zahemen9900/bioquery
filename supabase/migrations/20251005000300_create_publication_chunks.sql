CREATE SCHEMA IF NOT EXISTS research;

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS research.publication_chunks (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pmcid TEXT NOT NULL,
    title TEXT,
    url TEXT,
    chunk_index INTEGER NOT NULL,
    chunk TEXT NOT NULL,
    embedding VECTOR(512) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (pmcid, chunk_index)
);

CREATE INDEX IF NOT EXISTS publication_chunks_pmcid_idx
    ON research.publication_chunks (pmcid);

CREATE INDEX IF NOT EXISTS publication_chunks_url_idx
    ON research.publication_chunks (url);

CREATE INDEX IF NOT EXISTS publication_chunks_embedding_idx
    ON research.publication_chunks USING ivfflat (embedding vector_l2_ops)
    WITH (lists = 100);

CREATE OR REPLACE FUNCTION research.update_publication_chunks_updated_at()
RETURNS TRIGGER AS
$$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS publication_chunks_set_updated_at
    ON research.publication_chunks;

CREATE TRIGGER publication_chunks_set_updated_at
    BEFORE UPDATE ON research.publication_chunks
    FOR EACH ROW
    EXECUTE FUNCTION research.update_publication_chunks_updated_at();

CREATE OR REPLACE FUNCTION research.match_publication_chunks(
    query_embedding VECTOR(512),
    match_count INTEGER DEFAULT 5,
    filter_pmcid TEXT[] DEFAULT NULL,
    min_similarity DOUBLE PRECISION DEFAULT 0
)
RETURNS TABLE (
    id BIGINT,
    pmcid TEXT,
    title TEXT,
    url TEXT,
    chunk_index INTEGER,
    chunk TEXT,
    similarity DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = research, public
AS
$$
DECLARE
    safe_limit INTEGER;
BEGIN
    IF query_embedding IS NULL THEN
        RAISE EXCEPTION 'query_embedding must not be null';
    END IF;

    safe_limit := GREATEST(1, LEAST(50, COALESCE(match_count, 5)));

    RETURN QUERY
    SELECT
        c.id,
        c.pmcid,
        c.title,
        c.url,
        c.chunk_index,
        c.chunk,
        1 - (c.embedding <=> query_embedding) AS similarity
    FROM research.publication_chunks AS c
    WHERE (filter_pmcid IS NULL OR c.pmcid = ANY(filter_pmcid))
    ORDER BY c.embedding <-> query_embedding
    LIMIT safe_limit;
END;
$$;

GRANT USAGE ON SCHEMA research TO authenticated, service_role, anon;
GRANT SELECT ON ALL TABLES IN SCHEMA research TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION research.match_publication_chunks TO authenticated, service_role, anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA research
    GRANT SELECT ON TABLES TO authenticated, service_role, anon;

DROP FUNCTION IF EXISTS public.match_publication_chunks(vector(512), integer, text[], double precision);

CREATE OR REPLACE FUNCTION public.match_publication_chunks(
    query_embedding VECTOR(512),
    match_count INTEGER DEFAULT 5,
    filter_pmcid TEXT[] DEFAULT NULL,
    min_similarity DOUBLE PRECISION DEFAULT 0
)
RETURNS TABLE (
    id BIGINT,
    pmcid TEXT,
    title TEXT,
    url TEXT,
    chunk_index INTEGER,
    chunk TEXT,
    similarity DOUBLE PRECISION
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = research, public
AS
$$
SELECT *
FROM research.match_publication_chunks(query_embedding, match_count, filter_pmcid, min_similarity);
$$;

GRANT EXECUTE ON FUNCTION public.match_publication_chunks(vector(512), integer, text[], double precision) TO authenticated, service_role, anon;
