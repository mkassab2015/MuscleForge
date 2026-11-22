// Optional MuscleForge nutrition-photo backend. Deploy as a Cloudflare Worker.
// Secrets (never commit): OPENAI_API_KEY, MUSCLEFORGE_TOKEN.
// Set CORS_ORIGIN to https://mkassab2015.github.io in Worker variables.
const json=(value,status=200,origin="https://mkassab2015.github.io")=>new Response(JSON.stringify(value),{status,headers:{"content-type":"application/json","Access-Control-Allow-Origin":origin,"Vary":"Origin","Cache-Control":"no-store"}});
export default {
 async fetch(request,env){
  const allowed=env.CORS_ORIGIN||"https://mkassab2015.github.io";
  const origin=request.headers.get("Origin");
  if(origin && origin!==allowed)return new Response("Origin not allowed",{status:403});
  if(request.method==="OPTIONS")return new Response(null,{status:204,headers:{"Access-Control-Allow-Origin":allowed,"Access-Control-Allow-Methods":"POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type, X-MuscleForge-Token","Access-Control-Max-Age":"7200"}});
  if(request.method!=="POST")return json({error:"POST only"},405,allowed);
  if(!env.OPENAI_API_KEY||!env.MUSCLEFORGE_TOKEN)return json({error:"Secrets not configured"},503,allowed);
  if(request.headers.get("X-MuscleForge-Token")!==env.MUSCLEFORGE_TOKEN)return json({error:"Unauthorized"},401,allowed);
  if(Number(request.headers.get("content-length")||0)>3_000_000)return json({error:"Image too large"},413,allowed);
  let data;try{data=await request.json()}catch{return json({error:"Invalid JSON"},400,allowed)}
  if(typeof data.image!=="string"||!/^data:image\/(jpeg|png|webp);base64,/.test(data.image)||data.image.length>2_500_000)return json({error:"Invalid photo"},400,allowed);
  const note=String(data.note||"").slice(0,300);
  const prompt="Estimate calories and macronutrients for the edible portion(s) of this food photo. Be realistic, conservative about certainty, and account for likely sauces/oil. If portion size cannot be inferred, state that uncertainty in confidence. Output ONLY valid JSON with keys name (string), calories (non-negative number in kcal), protein (grams), carbs (grams), fat (grams), confidence (short uncertainty note). Never claim exact measurement. If no food is visible, return name \"Unidentified food\" and zero numbers with confidence \"Cannot identify food\". Additional user context: "+note;
  let response;
  try{
   response=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"Authorization":"Bearer "+env.OPENAI_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({model:"gpt-4.1-mini",max_tokens:450,response_format:{type:"json_object"},messages:[{role:"user",content:[{type:"text",text:prompt},{type:"image_url",image_url:{url:data.image,detail:"low"}}]}]})});
  }catch{return json({error:"Provider connection failed"},502,allowed)}
  if(!response.ok)return json({error:"AI provider refused request; check key and account billing"},502,allowed);
  let parsed;try{const payload=await response.json();parsed=JSON.parse(payload.choices[0].message.content)}catch{return json({error:"Invalid provider response"},502,allowed)}
  if(!parsed||typeof parsed.name!=="string"||["calories","protein","carbs","fat"].some(k=>!Number.isFinite(Number(parsed[k]))||Number(parsed[k])<0))return json({error:"Invalid estimated values"},502,allowed);
  const meal={name:parsed.name.slice(0,120),calories:Math.round(Number(parsed.calories)),protein:Number(parsed.protein),carbs:Number(parsed.carbs),fat:Number(parsed.fat),confidence:String(parsed.confidence||"Rough visual estimate; confirm portions").slice(0,220)};
  return json({meal},200,allowed);
 }
};