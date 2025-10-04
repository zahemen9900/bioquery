# Template Code to Use in App
---

```ts
fetch("https://api.freepik.com/v1/ai/mystic", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "x-freepik-api-key": "<PUT_YOUR_API_KEY>"
  },
  body: JSON.stringify({
  "prompt": "A luxurious Mediterranean-inspired living room with a modern minimalist twist, featuring grand arched openings and smooth stone columns, bathed in warm natural light. The ceiling showcases exposed wooden beams, adding rustic charm and authenticity to the space. The design combines traditional Mediterranean elements like textured stucco walls, warm terracotta tones, and soft neutral decor with sleek contemporary furniture, including a beige L-shaped sofa adorned with plush neutral-toned cushions and a smooth round coffee table in muted wood. The room is enhanced by a soft Persian-style rug in earthy hues, lush potted plants by the windows, and a delicate play of light and shadow creating a serene yet elegant atmosphere. The right side of the room opens seamlessly to a vibrant garden filled with lush greenery, visible through the large open arches, emphasizing the connection between indoor and outdoor spaces. Professionally color graded with warm pastel undertones, evoking the charm and tranquility of the Mediterranean coast.",
  "aspect_ratio": "classic_4_3"
})
})
.then(response => response.json())
.then(data => console.log(data));
```

## Flux: Versatile image generation with advanced realism

Experience the perfect synergy of speed and quality. Designed for both creative and professional projects, it delivers sharp, vibrant visuals that stay true to your text prompts.

    High-quality images with rich details and bold colors.
    Photorealistic results with enhanced realism.
    Combines fast generation times with precision output.
    Flexible controls for style, resolution, and aspect ratio customization.

```ts
fetch("https://api.freepik.com/v1/ai/text-to-image/flux-dev", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "x-freepik-api-key": "<PUT_YOUR_API_KEY>"
  },
  body: JSON.stringify({
  "prompt": "Red pomegranates on a gray plate with green leaves, against a dark background illuminated by soft pastel light, shades of pink and purple, dramatic lighting with a dark background",
  "aspect_ratio": "widescreen_16_9"
})
})
.then(response => response.json())
.then(data => console.log(data));

```


## Classic Fast: Instant image generation for real-time needs

Accelerate your workflow with near-instant image generation and versatile customization options. Ideal for rapid prototyping and dynamic apps demanding fast results.

    Lightning-fast image generation with minimal delay.
    Customizable styling for colors, lighting, and framing.
    Flexible image size support, including square formats.
    Adjustable guidance scale to balance creativity and precision.


```ts