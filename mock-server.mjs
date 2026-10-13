// Read-only frontend fixture server. No packages required. node mock-server.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const spec=JSON.parse(fs.readFileSync(path.join(dir,'openapi.json'),'utf8'));
const snap=JSON.parse(fs.readFileSync(path.join(dir,'control-example.json'),'utf8'));
const staticFiles=new Set(['handoff.html','swagger.html','swagger-ui.css','swagger-ui-bundle.js','openapi.json','openapi.yaml','schema.sql','database-map.svg','control-example.json','validation-report.json','acceptance-vectors.json','source-audit.json','figma-api-map.csv']);
const server=http.createServer((req,res)=>{
 res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Expose-Headers','ETag');
 res.setHeader('Access-Control-Allow-Headers','Authorization,If-Match,Content-Type');
 res.setHeader('Access-Control-Allow-Methods','GET,OPTIONS');
 if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
 const u=new URL(req.url,'http://localhost');
 const send=(status,data,type='application/json')=>{res.writeHead(status,{'Content-Type':type+'; charset=utf-8'});res.end(typeof data==='string'?data:JSON.stringify(data));};
 const fail=(status,code,detail)=>send(status,{type:'urn:pilot:mock:'+code.toLowerCase(),title:'Mock: '+code,status,detail,instance:u.pathname,code,traceId:'fixture-server',issues:[]},'application/problem+json');
 if(req.method!=='GET'){fail(501,'MOCK_READ_ONLY','Фикстуры только для чтения. Реальные команды реализует ASP.NET backend.');return;}
 if(!u.pathname.startsWith('/api/v1')){
  const name=u.pathname==='/'?'handoff.html':u.pathname.slice(1);
  if(!staticFiles.has(name)){fail(404,'NOT_FOUND','Файл не найден');return;}
  const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.yaml':'text/yaml','.svg':'image/svg+xml','.sql':'text/plain','.csv':'text/csv'}[path.extname(name)];
  send(200,fs.readFileSync(path.join(dir,name),'utf8'),mime);return;
 }
 const route=u.pathname.slice('/api/v1'.length);
 let matched;
 for(const [template,methods] of Object.entries(spec.paths)){
  const names=[...template.matchAll(/\{(\w+)\}/g)].map(m=>m[1]);
  const m=route.match(new RegExp('^'+template.replace(/\{\w+\}/g,'([^/]+)')+'$'));
  if(m&&methods.get){matched={op:methods.get,params:Object.fromEntries(names.map((n,i)=>[n,m[i+1]]))};break;}
 }
 if(!matched){fail(404,'NOT_FOUND','GET endpoint не найден');return;}
 const {op,params}=matched;
 if(params.analysisId&&params.analysisId!==snap.version.analysisId||params.versionId&&params.versionId!==snap.version.id){fail(404,'NOT_FOUND','В mock есть только IDs контрольного примера');return;}
 if(op.operationId.startsWith('export')){fail(501,'MOCK_NO_PDF','PDF реализуется backend по protocol-preview');return;}
 let result=op.responses['200']?.content?.['application/json']?.example;
 if(params.productId){const item=snap.products.find(x=>x.id===params.productId);if(!item){fail(404,'NOT_FOUND','Продукт не найден');return;}
  if(op.operationId==='getAssignmentOptions'){
   const signature=r=>JSON.stringify(r.steps.map(s=>[s.operationId,s.workplaceName??snap.operations.find(o=>o.id===s.operationId)?.data.workplaceName??null]));const route=snap.productRoutes.find(x=>x.productId===params.productId).route;
   result={revision:1,productId:params.productId,canCreateSeparateFamily:true,options:snap.families.map(f=>({familyId:f.id,canAssign:signature(f.data.route)===signature(route),routeMatches:signature(f.data.route)===signature(route),issues:[]}))};
  }else result=op.operationId==='getProductRoute'?snap.productRoutes.find(x=>x.productId===params.productId).route:item;
 }
 if(params.operationId){result=snap.operations.find(x=>x.id===params.operationId);}
 if(params.familyId){result=op.operationId==='getFamilyMetrics'?snap.metrics.find(x=>x.familyId===params.familyId)?.data:snap.families.find(x=>x.id===params.familyId);}
 if(params.decisionId&&params.decisionId!==spec.components.schemas.Decision.example.id)result=null;
 if(params.ruleId&&params.ruleId!==snap.version.rulesVersion)result=null;
 if(!result){fail(404,'NOT_FOUND','Фикстура не найдена');return;}
 result=structuredClone(result);
 if(result.items){
  const offset=Number(u.searchParams.get('offset')??0),limit=Number(u.searchParams.get('limit')??100);
  if(!Number.isInteger(offset)||offset<0||!Number.isInteger(limit)||limit<1||limit>1000){fail(400,'INVALID_REQUEST','offset>=0, limit=1..1000');return;}
  const query=(u.searchParams.get('q')??'').toLocaleLowerCase('ru');
  const label=x=>x.data?.name??x.data?.title??x.version?.data?.title??x.snapshot?.families?.find(f=>f.id===x.snapshot.selection.familyId)?.data.name??'';
  const completeness=u.searchParams.get('completeness')??'all';
  if(!['all','complete','incomplete'].includes(completeness)){fail(400,'INVALID_REQUEST','Некорректный completeness');return;}
  const all=result.items;
  const items=all.filter(x=>(label(x)+' '+(x.data?.productCode??'')).toLocaleLowerCase('ru').includes(query)&&(completeness==='all'||x.completeness===completeness));
  if(['listProducts','listOperations','listFamilies'].includes(op.operationId))items.sort((a,b)=>label(a).localeCompare(label(b),'ru')||a.id.localeCompare(b.id));
  result={items:items.slice(offset,offset+limit),offset,limit,total:items.length,unfilteredTotal:all.length};
 }
 if(params.versionId||op.operationId==='getAnalysis')res.setHeader('ETag',`"v:${snap.version.id}:r:1"`);
 send(200,result);
});
server.listen(5080,'127.0.0.1',()=>console.log('Read-only mock: http://localhost:5080/swagger.html — Ctrl+C to stop'));

