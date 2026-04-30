const fetch = require("node-fetch");

async function callModel(model, prompt) {
  try {
    const res = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false
      })
    });

    const data = await res.json();

    return data.response || "No response";

  } catch (err) {
    return "Model offline or failed";
  }
}

async function runKaafiPipeline(input) {

  const risk = await callModel("deepseek-r1:7b", input);

  const jsa = await callModel("mistral:7b-instruct", input);

  const docs = await callModel("gemma:7b", input);

  const summary = await callModel("phi3:medium", input);

  return {
    risk,
    jsa,
    docs,
    summary
  };
}

module.exports = { runKaafiPipeline };
