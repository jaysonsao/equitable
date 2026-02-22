Features  implemented 
Google MAP API 

Gemini Summary 
 for function 
The frontend should call:


POST /api/gemini
With this JSON body:


{
  "neighborhood": "Jamaica Plain",
  "context": {
    "gini": 0.48,
    "markets": ["Jamaica Plain Farmers Market", "Brookfield Farm CSA"]
  }
}
And it gets back:


{
  "response": "Jamaica Plain has a moderately high income inequality score of 0.48. The neighborhood has 2 farmers markets that accept SNAP-EBT, providing some food access for lower-income residents..."
}


example response : const res = await fetch("/api/gemini", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    neighborhood: "Jamaica Plain",
    context: {
      gini: 0.48,
      markets: ["Jamaica Plain Farmers Market"]
    }
  })
});
const data = await res.json();
console.log(data.response); // AI-generated summary

