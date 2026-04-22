const axios = require('axios');

async function test() {
  const res = await axios.get('https://html.duckduckgo.com/html/?q=megawide+ceo', {headers:{'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}});
  const matches = [...res.data.matchAll(/<a class="result__snippet[^>]*>(.*?)<\/a>/gi)];
  const snippets = matches.map(m => m[1].replace(/<\/?[^>]+(>|$)/g, ""));
  console.log(snippets);
}

test();
