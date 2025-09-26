
const { useEffect, useMemo, useState } = React;
const uid = () => Math.random().toString(36).slice(2, 9);
const todayISO = () => new Date().toISOString().slice(0, 10);
const CHAINS = ["Μασούτης","ΑΒ Βασιλόπουλος","Σκλαβενίτης","My Market","Κρητικός","Θανόπουλος","Άλλο"];

function save(k,v){localStorage.setItem(k,JSON.stringify(v));}
function load(k,f){try{const v=JSON.parse(localStorage.getItem(k));return v??f;}catch{return f;}}

function toCSV(rows){
  const hs = ["id","chain","venueName","venueCity","ossOwnerName","efood","trainingOwner","visitDate","needsFollowUp","followUp","storeManager","personnel","woltsPickers","staffsEngagement","storeSize","storeLayout","internet","contactCustomers","devices","firmwareUpdate","problems","status","assignedTo","createdAt"];
  const esc = s => String(s??"").replaceAll('"','""').replace(/\n/g," ");
  return [hs.join(",")].concat(rows.map(r=>hs.map(h=>`"${esc(Array.isArray(r[h])?r[h].join(";"):r[h])}"`).join(","))).join("\n");
}
function download(filename, text) {const blob=new Blob([text],{type:"text/csv;charset=utf-8;"});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;a.click();}

const DEFAULT_TEAM=[{id:"eleni",name:"Eleni"},{id:"member2",name:"Μέλος 2"},{id:"member3",name:"Μέλος 3"}];
const DEFAULT_STATUSES=[{id:"planned",label:"Προγραμματισμένο"},{id:"completed",label:"Ολοκληρωμένο"},{id:"cancelled",label:"Ακυρωμένο"}];

function WoltFieldVisitsApp(){

  const [team,setTeam]=useState(()=>load("wfv_team",DEFAULT_TEAM));
  const [visits,setVisits]=useState(()=>load("wfv_visits",[]));
  const [filters,setFilters]=useState({q:"",member:"",status:"",from:"",to:"",chain:""});
  const [activeChain,setActiveChain]=useState("");

  const blank={chain:"",venueName:"",venueCity:"",ossOwnerName:"",efood:"No",trainingOwner:"",visitDate:todayISO(),needsFollowUp:"No",followUp:"",storeManager:"",personnel:"",woltsPickers:"",staffsEngagement:3,storeSize:"",storeLayout:"",internet:"",contactCustomers:"No",devices:"",firmwareUpdate:"No",problems:"",status:"planned",assignedTo:(team[0]||{}).id||"",createdAt:todayISO()};

  const [form,setForm]=useState(blank);

  useEffect(()=>save("wfv_team",team),[team]);
  useEffect(()=>save("wfv_visits",visits),[visits]);

  const chains = useMemo(()=> Array.from(new Set([].concat(CHAINS, visits.map(v=>v.chain).filter(Boolean)))),[visits]);

  const filtered = useMemo(()=>{
    return visits
      .filter(v=> activeChain? v.chain===activeChain : true)
      .filter(v=> filters.q? [v.venueName,v.venueCity,v.followUp,v.problems,v.storeManager].join(" ").toLowerCase().includes(filters.q.toLowerCase()):true)
      .filter(v=> filters.member? v.assignedTo===filters.member : true)
      .filter(v=> filters.status? v.status===filters.status : true)
      .filter(v=> filters.chain? v.chain===filters.chain : true)
      .filter(v=> filters.from? v.visitDate>=filters.from : true)
      .filter(v=> filters.to? v.visitDate<=filters.to : true)
      .sort((a,b)=>`${b.visitDate}`.localeCompare(`${a.visitDate}`));
  },[visits,filters,activeChain]);

  function addVisit(){
    if(!form.chain) return alert("Διάλεξε αλυσίδα.");
    if(!form.venueName) return alert("Συμπλήρωσε Venue Name.");
    const v={id:uid(),...form};
    setVisits(prev=>[v,...prev]);
    setForm(blank);
  }
  function updateVisit(id,patch){setVisits(prev=>prev.map(v=>v.id===id?{...v,...patch}:v));}
  function removeVisit(id){if(!confirm("Να διαγραφεί;"))return; setVisits(prev=>prev.filter(v=>v.id!==id));}
  function exportCSV(){download(`wolt-field-visits-${todayISO()}.csv`, toCSV(visits));}
  function importCSV(file){const reader=new FileReader();reader.onload=()=>{try{const text=String(reader.result);const [headerLine,...lines]=text.split(/\r?\n/).filter(Boolean);const heads=headerLine.split(",").map(h=>h.replace(/(^\"|\"$)/g,""));const parse=s=>s.replace(/(^\"|\"$)/g,"").replaceAll('""','"');const rows=lines.map(line=>{const cols=line.match(/\"(?:[^\"]|\"\")*\"|[^,]+/g)||[];const o={};heads.forEach((h,i)=>o[h]=parse(cols[i]??""));return o;}); setVisits(rows.map(r=>({...r,id:r.id||uid(),staffsEngagement:Number(r.staffsEngagement||3)}))); alert("OK: CSV εισήχθη.");}catch(e){alert("Σφάλμα CSV"); console.error(e);}}; reader.readAsText(file);}

  return (
    <div className="min-h-screen bg-gray-50 md:flex">
      <aside className="md:w-60 border-r bg-white">
        <div className="p-3 border-b"><div className="text-sm font-semibold">Αλυσίδες</div></div>
        <nav className="p-2 space-y-1">
          <button onClick={()=>setActiveChain("")} className={"w-full text-left px-3 py-2 rounded-xl " + (activeChain===""?"bg-blue-50":"hover:bg-gray-50")}>Όλες</button>
          {chains.map(ch=>(
            <button key={ch} onClick={()=>setActiveChain(ch)} className={"w-full text-left px-3 py-2 rounded-xl " + (activeChain===ch?"bg-blue-100":"hover:bg-gray-50")}>{ch||"—"}</button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-4">
        <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold">Wolt — Επισκέψεις</h1>
            <p className="text-xs text-gray-600">Πεδία σύμφωνα με το spreadsheet + φίλτρα ανά αλυσίδα.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="rounded-xl px-3 py-2 shadow bg-white text-xs">Εξαγωγή CSV</button>
            <label className="rounded-xl px-3 py-2 shadow bg-white text-xs cursor-pointer">Εισαγωγή CSV
              <input type="file" accept=".csv" className="hidden" onChange={(e)=>e.target.files?.[0]&&importCSV(e.target.files[0])}/>
            </label>
          </div>
        </header>

        <section className="mb-4 rounded-2xl bg-white p-3 shadow">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            <Input label="Αναζήτηση" value={filters.q} onChange={e=>setFilters({...filters,q:e.target.value})}/>
            <Select label="Αλυσίδα" value={filters.chain} onChange={e=>setFilters({...filters,chain:e.target.value})}>
              <option value="">Όλες</option>
              {chains.map(ch=><option key={ch} value={ch}>{ch}</option>)}
            </Select>
            <Select label="Μέλος" value={filters.member} onChange={e=>setFilters({...filters,member:e.target.value})}>
              <option value="">Όλα</option>
              {team.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
            <Select label="Κατάσταση" value={filters.status} onChange={e=>setFilters({...filters,status:e.target.value})}>
              <option value="">Όλες</option>
              {DEFAULT_STATUSES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
            </Select>
            <Input label="Από" type="date" value={filters.from} onChange={e=>setFilters({...filters,from:e.target.value})}/>
            <Input label="Έως" type="date" value={filters.to} onChange={e=>setFilters({...filters,to:e.target.value})}/>
          </div>
        </section>

        <section className="mb-6 rounded-2xl bg-white p-3 shadow">
          <h2 className="mb-2 text-base font-semibold">Νέα επίσκεψη</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Select label="Αλυσίδα" value={form.chain} onChange={e=>setForm({...form,chain:e.target.value})}>
              <option value="">–</option>
              {CHAINS.map(c=><option key={c} value={c}>{c}</option>)}
            </Select>
            <Input label="Venue Name" value={form.venueName} onChange={e=>setForm({...form,venueName:e.target.value})}/>
            <Input label="Venue City" value={form.venueCity} onChange={e=>setForm({...form,venueCity:e.target.value})}/>
            <Input label="OSS Owner Name" value={form.ossOwnerName} onChange={e=>setForm({...form,ossOwnerName:e.target.value})}/>
            <Select label="Efood" value={form.efood} onChange={e=>setForm({...form,efood:e.target.value})}>
              <option>No</option><option>Yes</option>
            </Select>
            <Input label="Training Owner" value={form.trainingOwner} onChange={e=>setForm({...form,trainingOwner:e.target.value})}/>
            <Input label="Visit Date" type="date" value={form.visitDate} onChange={e=>setForm({...form,visitDate:e.target.value})}/>
            <Select label="Needs Follow Up" value={form.needsFollowUp} onChange={e=>setForm({...form,needsFollowUp:e.target.value})}>
              <option>No</option><option>Yes</option>
            </Select>
            <Input label="Follow Up" value={form.followUp} onChange={e=>setForm({...form,followUp:e.target.value})}/>
            <Input label="Store Manager" value={form.storeManager} onChange={e=>setForm({...form,storeManager:e.target.value})}/>
            <Input label="Personnel" value={form.personnel} onChange={e=>setForm({...form,personnel:e.target.value})}/>
            <Input label="Wolt's Pickers" value={form.woltsPickers} onChange={e=>setForm({...form,woltsPickers:e.target.value})}/>
            <Range label={`Staff's Engagement (${form.staffsEngagement})`} min={1} max={5} value={form.staffsEngagement} onChange={e=>setForm({...form,staffsEngagement:Number(e.target.value)})}/>
            <Input label="Store Size" value={form.storeSize} onChange={e=>setForm({...form,storeSize:e.target.value})}/>
            <Input label="Store Layout" value={form.storeLayout} onChange={e=>setForm({...form,storeLayout:e.target.value})}/>
            <Input label="Internet" value={form.internet} onChange={e=>setForm({...form,internet:e.target.value})}/>
            <Select label="Contact Customers" value={form.contactCustomers} onChange={e=>setForm({...form,contactCustomers:e.target.value})}>
              <option>No</option><option>Yes</option>
            </Select>
            <Input label="Devices" value={form.devices} onChange={e=>setForm({...form,devices:e.target.value})}/>
            <Select label="Firmware Update" value={form.firmwareUpdate} onChange={e=>setForm({...form,firmwareUpdate:e.target.value})}>
              <option>No</option><option>Yes</option>
            </Select>
            <Textarea label="Problems" value={form.problems} onChange={e=>setForm({...form,problems:e.target.value})}/>
            <Select label="Κατάσταση" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
              {DEFAULT_STATUSES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
            </Select>
            <Select label="Μέλος ομάδας" value={form.assignedTo} onChange={e=>setForm({...form,assignedTo:e.target.value})}>
              {team.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </div>
          <div className="mt-3 flex justify-end">
            <button onClick={addVisit} className="rounded-2xl bg-blue-600 px-5 py-2 text-white shadow">Αποθήκευση</button>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-3 shadow">
          <h2 className="mb-2 text-base font-semibold">Επισκέψεις</h2>
          {filtered.length===0 ? (<EmptyState/>) : (
            <div className="grid grid-cols-1 gap-2">
              {filtered.map(v=>(<VisitCard key={v.id} v={v} team={team} onUpdate={updateVisit} onRemove={removeVisit}/>))}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-2xl bg-white p-3 shadow">
          <h2 className="mb-2 text-base font-semibold">Ομάδα</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {team.map((m,i)=>(<Input key={m.id} label={`Μέλος ${i+1}`} value={m.name} onChange={e=>setTeam(team.map(t=>t.id===m.id?{...t,name:e.target.value}:t))}/>))}
          </div>
        </section>
      </main>
    </div>
  );
}

// Tiny components
function Input({label,className="",...props}){return (<label className={`block ${className}`}><span className="mb-1 block text-sm font-medium text-gray-700">{label}</span><input {...props} className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"/></label>);}
function Textarea({label,className="",...props}){return (<label className={`block ${className}`}><span className="mb-1 block text-sm font-medium text-gray-700">{label}</span><textarea {...props} rows={4} className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"/></label>);}
function Select({label,children,className="",...props}){return (<label className={`block ${className}`}><span className="mb-1 block text-sm font-medium text-gray-700">{label}</span><select {...props} className="w-full rounded-xl border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">{children}</select></label>);}
function Range({label,className="",...props}){return (<label className={`block ${className}`}><span className="mb-1 block text-sm font-medium text-gray-700">{label}</span><input type="range" {...props} className="w-full"/></label>);}
function Badge({children}){return <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">{children}</span>}
function VisitCard({v,team,onUpdate,onRemove}){const memberName=(team.find(t=>t.id===v.assignedTo)||{}).name||"—";return (
  <div className="rounded-2xl border p-3 shadow-sm">
    <div className="mb-1 flex items-start justify-between gap-2">
      <div>
        <div className="text-xs text-gray-600">{v.chain} • {v.visitDate}</div>
        <div className="text-base font-semibold">{v.venueName||"—"}</div>
        <div className="text-xs text-gray-600">{v.venueCity}</div>
      </div>
      <div className="flex items-center gap-2">
        <select value={v.status} onChange={e=>onUpdate(v.id,{status:e.target.value})} className="rounded-xl border px-2 py-1 text-xs">
          {DEFAULT_STATUSES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <button onClick={()=>onRemove(v.id)} className="rounded-xl border px-2 py-1 text-xs hover:bg-red-50">Διαγραφή</button>
      </div>
    </div>
    <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
      <Badge>Μέλος: {memberName}</Badge>
      <Badge>Efood: {v.efood}</Badge>
      <Badge>Follow up: {v.needsFollowUp}</Badge>
      <Badge>Engagement: {v.staffsEngagement}/5</Badge>
    </div>
    {v.problems && (<div className="mb-1 text-sm whitespace-pre-wrap"><span className="font-medium">Προβλήματα:</span> {v.problems}</div>)}
    {v.followUp && (<div className="mb-1 text-sm whitespace-pre-wrap"><span className="font-medium">Follow up:</span> {v.followUp}</div>)}
    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
      <button onClick={()=>onUpdate(v.id,{staffsEngagement:Math.max(1, Number(v.staffsEngagement)||1 - 1)})} className="rounded-xl border px-3 py-2">− Engagement</button>
      <button onClick={()=>onUpdate(v.id,{staffsEngagement:Math.min(5, (Number(v.staffsEngagement)||1) + 1)})} className="rounded-xl border px-3 py-2">+ Engagement</button>
      <button onClick={()=>onUpdate(v.id,{visitDate:todayISO(), status:"completed"})} className="rounded-xl border px-3 py-2">Ολοκληρωμένο σήμερα</button>
      <button onClick={()=>onUpdate(v.id,{status:"planned"})} className="rounded-xl border px-3 py-2">Προγραμματισμένο</button>
    </div>
  </div>
);}
function EmptyState(){return (<div className="rounded-2xl border border-dashed p-6 text-center text-sm text-gray-600">Δεν υπάρχουν εγγραφές.</div>);}

// expose
window.WoltFieldVisitsApp = WoltFieldVisitsApp;
