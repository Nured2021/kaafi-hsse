const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";

export async function askOllama(model, prompt) {
  const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Ollama ${model} request failed: ${response.status} ${detail}`);
  }

  const data = await response.json();
  return data.response || "";
}

export function safeJsonParse(value, fallback) {
  if (!value) {
    return fallback;
  }

  const jsonMatch = value.match(/\{[\s\S]*\}/);
  const candidate = jsonMatch ? jsonMatch[0] : value;

  try {
    return JSON.parse(candidate);
  } catch {
    return fallback;
  }
}
