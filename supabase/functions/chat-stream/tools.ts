// Removed dependency on @google/genai Type definitions

type GenericFunctionDeclaration = {
	name: string
	description: string
	parameters: {
		type: string
		properties: Record<string, unknown>
		required?: string[]
	}
}

const stringArraySchema: { type: string; items: { type: string } } = {
	type: "array",
	items: { type: "string" },
}

export const createDocumentTool: GenericFunctionDeclaration = {
	name: "create_document",
	description:
		"Create a long-form document artifact that should be stored for later reference. Use this after you have the final text ready.",
	parameters: {
		type: "object",
		properties: {
			title: {
				type: "string",
				description: "Human-friendly title for the document.",
			},
			body: {
				type: "string",
				description: "Full body content of the document in markdown or plain text.",
			},
			document_type: {
				type: "string",
				description: "Document classification to help downstream organization.",
				enum: ["document", "translation", "other"],
			},
			image_prompt: {
				type: "string",
				description: "Optional prompt describing an image that should accompany the document.",
			},
			image_link: {
				type: "string",
				description: "Optional URL pointing to an image or asset associated with the document.",
			},
			image_aspect_ratio: {
				type: "string",
				description: "Optional aspect ratio preset for auto-generated images (e.g., 'widescreen_16_9').",
			},
			tags: {
				...stringArraySchema,
				description: "Topic tags that make the document discoverable.",
			},
			metadata: {
				type: "object",
				description: "Additional JSON metadata to persist with the document (key-value pairs).",
			},
		},
		required: ["title", "body"],
	},
}

export const updateDocumentTool: GenericFunctionDeclaration = {
	name: "update_document",
	description:
		"Update an existing document artifact. Only send the fields you want to change.",
	parameters: {
		type: "object",
		properties: {
			doc_id: {
				type: "string",
				description: "Identifier of the document returned by create_document or translate_publication.",
			},
			title: {
				type: "string",
				description: "Revised title for the document.",
			},
			body: {
				type: "string",
				description: "Updated document body.",
			},
			tags: {
				...stringArraySchema,
				description: "Replace the document's tags with this list.",
			},
			image_prompt: {
				type: "string",
				description: "Optional new prompt for a companion image.",
			},
			image_link: {
				type: "string",
				description: "Optional URL pointing to an updated asset.",
			},
			document_type: {
				type: "string",
				description: "Update the stored document classification.",
				enum: ["document", "translation", "other"],
			},
			metadata: {
				type: "object",
				description: "Replace the document's metadata payload.",
			},
			image_aspect_ratio: {
				type: "string",
				description: "Optional aspect ratio preset for any regenerated image (e.g., 'classic_4_3').",
			},
		},
		required: ["doc_id"],
	},
}

export const generateImageTool: GenericFunctionDeclaration = {
	name: "generate_image",
	description:
		"Generate a bespoke illustration via the Freepik API and store it in the generated-artifacts bucket, returning a signed URL for display.",
	parameters: {
		type: "object",
		properties: {
			prompt: {
				type: "string",
				description: "Detailed description of the image to generate.",
			},
			show_to_user: {
				type: "boolean",
				description: "If true, the application should display the image inline for the user immediately.",
			},
			tags: {
				...stringArraySchema,
				description: "Optional topic tags that describe the generated image.",
			},
			aspect_ratio: {
				type: "string",
				description: "Optional aspect ratio preset supported by Freepik (e.g., 'widescreen_16_9', 'classic_4_3').",
			},
		},
		required: ["prompt", "show_to_user"],
	},
}

export const createVisualJsonTool: GenericFunctionDeclaration = {
	name: "create_visual_json",
	description:
		"Create structured data for a chart that can be rendered in the UI. Use for bar, line, or pie charts.",
	parameters: {
		type: "object",
		properties: {
			chart_type: {
				type: "string",
				description: "Type of chart to render (pie, bar, or line).",
				enum: ["pie", "bar", "line"],
			},
			title: {
				type: "string",
				description: "Short title describing the visualization.",
			},
			data_points: {
				type: "array",
				description: "Data points to plot. Keep the list concise (<= 20 items).",
				items: {
					type: "object",
					properties: {
						label: {
							type: "string",
							description: "Display label for the data point.",
						},
						value: {
							type: "number",
							description: "Numeric value for the data point.",
						},
					},
					required: ["label", "value"],
				},
			},
			tags: {
				...stringArraySchema,
				description: "Tags describing the visualization content.",
			},
		},
		required: ["chart_type", "title", "data_points"],
	},
}

export const createKnowledgeGraphTool: GenericFunctionDeclaration = {
	name: "create_knowledge_graph_json",
	description:
		"Produce a structured knowledge graph describing relationships between entities extracted from research.",
	parameters: {
		type: "object",
		properties: {
			nodes: {
				type: "array",
				description: "List of graph nodes with unique ids.",
				items: {
					type: "object",
					properties: {
						id: { type: "string", description: "Unique identifier for the node." },
						label: { type: "string", description: "Readable label for the node." },
						type: { type: "string", description: "Optional semantic type for grouping." },
					},
					required: ["id", "label"],
				},
			},
			edges: {
				type: "array",
				description: "Relationships between nodes.",
				items: {
					type: "object",
					properties: {
						source: { type: "string", description: "Source node id." },
						target: { type: "string", description: "Target node id." },
						relation: { type: "string", description: "Description of the relationship." },
					},
					required: ["source", "target", "relation"],
				},
			},
			context: {
				type: "string",
				description: "Optional background text explaining the graph.",
			},
			tags: {
				...stringArraySchema,
				description: "Tags describing the graph's topic.",
			},
		},
		required: ["nodes", "edges"],
	},
}

export const timelineBuilderTool: GenericFunctionDeclaration = {
	name: "timeline_builder",
	description:
		"Create a narrative timeline where each section captures a milestone, description, and optional image prompt.",
	parameters: {
		type: "object",
		properties: {
			title: {
				type: "string",
				description: "Title for the resulting timeline artifact.",
			},
			timeline_sections: {
				type: "array",
				description: "Ordered list of timeline sections from start to finish.",
				items: {
					type: "object",
					properties: {
						title: {
							type: "string",
							description: "Headline for the section.",
						},
						description: {
							type: "string",
							description: "Supporting narrative for the section.",
						},
						image_prompt: {
							type: "string",
							description: "Optional prompt describing a visual for this section.",
						},
					},
					required: ["title", "description"],
				},
			},
			tags: {
				...stringArraySchema,
				description: "Tags highlighting the theme of the timeline.",
			},
		},
		required: ["title", "timeline_sections"],
	},
}

export const artifactCreationTools: GenericFunctionDeclaration[] = [
	createDocumentTool,
	updateDocumentTool,
	generateImageTool,
	createVisualJsonTool,
	createKnowledgeGraphTool,
	timelineBuilderTool,
]

export function buildArtifactToolboxGuidance(tools: GenericFunctionDeclaration[]): string {
	const names = new Set(tools.map((tool) => tool.name))
	const lines: string[] = []

	if (names.has("create_document")) {
		lines.push(
			"create_document: Persist polished narrative content. Supply a descriptive title, the full body text, and helpful tags.",
		)
	}

	if (names.has("update_document")) {
		lines.push(
			"update_document: Revise an existing document when the stored version should change. Only send fields that differ.",
		)
	}

	if (names.has("generate_image")) {
		lines.push(
			"generate_image: Craft a vivid prompt when a fresh visual is helpful; the tool returns a signed URL for the generated asset.",
		)
	}

	if (names.has("create_visual_json")) {
		lines.push(
			"create_visual_json: When you have quantitative comparisons, emit a concise dataset (<=20 points) for a pie, bar, or line chart.",
		)
	}

	if (names.has("create_knowledge_graph_json")) {
		lines.push(
			"create_knowledge_graph_json: Capture entities and relationships extracted from research so the UI can render an interactive graph.",
		)
	}

	if (names.has("timeline_builder")) {
		lines.push(
			"timeline_builder: Summarize events or milestones chronologically with rich descriptions and optional image prompts per step.",
		)
	}

	if (!lines.length) return ""
	return `\n\nTOOLBOX HINTS\n${lines.map((entry) => `• ${entry}`).join("\n")}`
}
