export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed'});}
  if(!process.env.GOOGLE_SHEETS_WEBHOOK_URL)return res.status(503).json({error:'Registration is being set up. Please try again later.'});
  const data=req.body||{};
  const fields=['name','whatsapp','email','college','collegeOther','year','exam','plan','groupSize','referredBy','notes'];
  const clean={};
  for(const key of fields)clean[key]=String(data[key]??'').trim().slice(0,key==='notes'?500:180);
  if(!clean.name||!/^\\d{10}$/.test(clean.whatsapp)||!clean.college||!clean.year||!clean.exam||!clean.plan||data.consent!==true)return res.status(400).json({error:'Please complete the required fields.'});
  const allowedPlans=['DigiOne','DigiTwo','DigiNEET','Mission INI-CET 2026','Need guidance'];
  if(!allowedPlans.includes(clean.plan))return res.status(400).json({error:'Please choose a valid learning plan.'});
  try{
    const response=await fetch(process.env.GOOGLE_SHEETS_WEBHOOK_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({...clean,consent:true,createdAt:new Date().toISOString()}),redirect:'follow',signal:AbortSignal.timeout(12000)});
    if(!response.ok)return res.status(502).json({error:'Could not save your registration. Please try again.'});
    const result=await response.json().catch(()=>null);
    if(!result||result.ok!==true)return res.status(502).json({error:'Could not confirm your registration was saved.'});
    return res.status(200).json({ok:true});
  }catch{return res.status(502).json({error:'Registration service is temporarily unavailable. Please try again.'});}
}
