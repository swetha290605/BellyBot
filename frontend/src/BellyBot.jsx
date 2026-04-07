import { useState, useEffect, useRef } from "react";

// ============================================================
// BellyBot v2 — Filter-First React Frontend
// ============================================================
// NEW: Shows the hard filter stage clearly:
//   • Filter preview before generation
//   • Rejection log with reasons
//   • Safe pool size vs total corpus
//   • Allergen badges on profile
// ============================================================

const API = "http://localhost:8000";

const MEAL_TYPES    = ["Breakfast","Lunch","Dinner","Snack","Dessert","Drink"];
const DIET_OPTIONS  = ["Non Vegeterian","Vegetarian","Vegan","Keto","Paleo","Mediterranean","Jain","Halal","Pescatarian"];
const FITNESS_GOALS = ["Weight Loss","Muscle Gain","Maintenance","Heart Health","Gut Health","Diabetes Control","Improve Stamina"];
const ACTIVITY_LVL  = ["Sedentary","Lightly Active","Moderately Active","Very Active","Athlete"];
const HEALTH_CONDS  = ["None","Diabetes","Hypertension","PCOS","Thyroid","IBS","High Cholesterol","Kidney Disease","Heart Disease","Celiac"];
const ALLERGIES     = ["None","Gluten","Dairy","Nuts","Eggs","Soy","Shellfish","Fish","Peanuts","Sesame"];
const GENDERS       = ["Male","Female","Non-binary","Prefer not to say"];

const C = {
  bg:"#06080F", surface:"#0D1018", border:"rgba(99,179,237,0.12)",
  blue:"#60A5FA", green:"#34D399", red:"#F87171", gold:"#FBBF24",
  purple:"#A78BFA", teal:"#2DD4BF", orange:"#FB923C",
  text:"#F1F5F9", soft:"#CBD5E1", muted:"#475569",
};

const chip = (active, color = C.blue) => ({
  padding:"5px 13px", borderRadius:"20px", fontSize:"12px",
  fontFamily:"inherit", cursor:"pointer",
  border: active ? `1.5px solid ${color}` : `1px solid ${C.border}`,
  background: active ? `${color}1A` : "rgba(255,255,255,0.02)",
  color: active ? color : C.muted, transition:"all 0.15s",
});

const mono = { fontFamily:"'JetBrains Mono', monospace" };

function Lbl({ c = C.muted, children }) {
  return <div style={{ ...mono, fontSize:"9.5px", letterSpacing:"0.14em", textTransform:"uppercase",
                       fontWeight:700, color:c, marginBottom:6, marginTop:14 }}>{children}</div>;
}

function Input({ value, onChange, placeholder, type = "text" }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ width:"100%", boxSizing:"border-box", background:"rgba(255,255,255,0.03)",
               border:`1px solid ${C.border}`, borderRadius:9, padding:"9px 13px",
               color:C.text, fontSize:"13px", ...mono, outline:"none" }} />
  );
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width:"100%", boxSizing:"border-box", background:C.surface,
               border:`1px solid ${C.border}`, borderRadius:9, padding:"9px 13px",
               color: value ? C.text : C.muted, fontSize:"13px", ...mono, outline:"none", cursor:"pointer" }}>
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  );
}

function Chips({ options, selected, onChange, color, multi = false }) {
  const toggle = v => {
    if (!multi) { onChange(v); return; }
    if (v === "None") { onChange(selected.includes("None") ? [] : ["None"]); return; }
    const f = selected.filter(x => x !== "None");
    onChange(f.includes(v) ? f.filter(x => x !== v) : [...f, v]);
  };
  const isActive = v => multi ? selected.includes(v) : selected === v;
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
      {options.map(o => (
        <button key={o} style={chip(isActive(o), color)} onClick={() => toggle(o)}>{o}</button>
      ))}
    </div>
  );
}

// Allergen tag badge
function AllergenTag({ label }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4,
                   background:`${C.red}14`, border:`1px solid ${C.red}44`,
                   borderRadius:12, padding:"3px 10px",
                   fontSize:"11px", color:C.red, ...mono }}>
      🚫 {label}
    </span>
  );
}

// Filter stats bar
function FilterBar({ total, safe, rejected }) {
  if (!total) return null;
  const pct = Math.round((safe / total) * 100);
  return (
    <div style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${C.border}`,
                  borderRadius:10, padding:"10px 14px", marginBottom:14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
        <span style={{ fontSize:"11px", color:C.muted, ...mono }}>
          Hard Filter: <span style={{ color:C.green }}>{safe} safe</span> / {total} total
          {" "}(<span style={{ color:C.red }}>{rejected} rejected</span>)
        </span>
        <span style={{ fontSize:"11px", color:C.gold, ...mono }}>{pct}% pass rate</span>
      </div>
      <div style={{ height:5, background:"rgba(255,255,255,0.05)", borderRadius:3, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, borderRadius:3,
                      background:`linear-gradient(90deg, ${C.red}, ${C.green})`,
                      transition:"width 0.6s ease" }} />
      </div>
    </div>
  );
}

export default function BellyBot() {
  const [tab, setTab] = useState("profile");
  const [profile, setProfile] = useState({
    age:"", gender:"", height_cm:"", weight_kg:"",
    activity_level:"", fitness_goal:"", dietary_preference:"",
    health_conditions:[], allergies:[],
  });
  const [profileSaved, setProfileSaved] = useState(false);

  const [ingredients, setIngredients] = useState("");
  const [mealType, setMealType]       = useState("");
  const [servings, setServings]       = useState("2");

  const [recipes, setRecipes]         = useState([]);
  const [rejectionLog, setRejectionLog] = useState([]);
  const [sbertMatches, setSbertMatches] = useState([]);
  const [filterStats, setFilterStats] = useState(null);
  const [pipelineLog, setPipelineLog] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [activeRecipe, setActiveRecipe] = useState(0);
  const [showRejections, setShowRejections] = useState(false);
  const [apiStatus, setApiStatus]     = useState("checking");
  const [filterPreview, setFilterPreview] = useState(null);
  const logRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/`).then(r => r.json())
      .then(() => setApiStatus("online"))
      .catch(() => setApiStatus("offline"));
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [pipelineLog]);

  const log = (phase, msg) =>
    setPipelineLog(p => [...p, { phase, msg, ts: new Date().toLocaleTimeString() }]);

  const profilePayload = () => ({
    age:                profile.age ? parseInt(profile.age) : null,
    gender:             profile.gender || null,
    height_cm:          profile.height_cm ? parseFloat(profile.height_cm) : null,
    weight_kg:          profile.weight_kg ? parseFloat(profile.weight_kg) : null,
    activity_level:     profile.activity_level || null,
    fitness_goal:       profile.fitness_goal?.toLowerCase().replace(" ", "-") || null,
    dietary_preference: profile.dietary_preference?.toLowerCase() || null,
    health_conditions:  profile.health_conditions.filter(x => x !== "None").map(x => x.toLowerCase()),
    allergies:          profile.allergies.filter(x => x !== "None").map(x => x.toLowerCase()),
  });

  // Preview filter before generate
  const previewFilter = async () => {
    if (!mealType) return;
    try {
      const res = await fetch(`${API}/filter/preview`, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ ingredients: ingredients || "any", meal_type: mealType, servings: parseInt(servings), profile: profilePayload() }),
      });
      const d = await res.json();
      setFilterPreview(d);
    } catch (_) {}
  };

  const generate = async () => {
    if (!ingredients.trim() || !mealType) return;
    setLoading(true); setRecipes([]); setPipelineLog([]);
    setRejectionLog([]); setFilterStats(null); setSbertMatches([]);
    setTab("pipeline");

    log("sys", `🚀 BellyBot v2 Filter-First Pipeline`);
    log("filter", `Allergens to block: [${profile.allergies.filter(x=>x!=="None").join(", ") || "none"}]`);
    log("filter", `Diet: ${profile.dietary_preference || "omnivore"} | Conditions: [${profile.health_conditions.filter(x=>x!=="None").join(", ") || "none"}]`);

    try {
      const payload = {
        ingredients, meal_type: mealType,
        servings: parseInt(servings),
        profile: profilePayload(),
      };

      const res = await fetch(`${API}/generate`, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "API error");
      }

      const d = await res.json();

      d.pipeline_steps.forEach(s => {
        const phase = s.includes("[1/3]") ? "filter" : s.includes("[2/3]") ? "sbert" : s.includes("[3/3]") ? "llm" : "sys";
        log(phase, s);
      });

      log("sbert", `SBERT top matches: ${d.sbert_top_matches.join(" | ")}`);
      log("sys", `✅ Done | Safe pool: ${d.safe_pool_size}/${d.total_corpus_size} | Recipes: ${d.recipes.length}`);

      setRecipes(d.recipes);
      setRejectionLog(d.rejection_log || []);
      setSbertMatches(d.sbert_top_matches);
      setFilterStats({ safe: d.safe_pool_size, total: d.total_corpus_size, rejected: d.rejection_log?.length || 0 });
      setActiveRecipe(0);
      setTab("cook");
    } catch (e) {
      log("err", `❌ ${e.message}`);
      if (e.message.includes("fetch")) log("err", "💡 Start backend: python main.py");
    }
    setLoading(false);
  };

  const phaseStyle = { filter:C.orange, sbert:C.teal, llm:C.purple, sys:C.green, err:C.red };
  const phaseLabel = { filter:"FILTER", sbert:"SBERT", llm:"LLM", sys:"SYS", err:"ERR" };

  const activeAllergies = profile.allergies.filter(x => x !== "None");
  const activeConditions = profile.health_conditions.filter(x => x !== "None");

  return (
    <div style={{ minHeight:"100vh", background:C.bg, ...mono, color:C.text,
                  backgroundImage:`radial-gradient(ellipse 60% 35% at 50% -5%, rgba(96,165,250,0.06) 0%, transparent 65%)` }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&family=Fraunces:ital,wght@0,700;0,900;1,600&display=swap" rel="stylesheet"/>

      {/* Header */}
      <div style={{ textAlign:"center", padding:"36px 20px 0" }}>
        <div style={{ fontSize:"9px", letterSpacing:"0.35em", color:C.blue, opacity:0.6, marginBottom:8 }}>
          HARD FILTER → SBERT → RAG → LLM → PERSONALIZED RECIPES
        </div>
        <h1 style={{ fontFamily:"'Fraunces', serif", fontSize:"clamp(2rem,5.5vw,3.4rem)",
                     fontWeight:900, margin:"0 0 6px", letterSpacing:"-0.02em",
                     background:`linear-gradient(130deg, ${C.blue} 0%, ${C.teal} 45%, ${C.green} 100%)`,
                     WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
          BellyBot v2 🫙
        </h1>
        <p style={{ color:C.muted, fontSize:"12px", margin:0 }}>
          Filter-First AI Recipe Intelligence — Safety Before Semantics
        </p>
      </div>

      {/* Model badges */}
      <div style={{ display:"flex", justifyContent:"center", gap:8, flexWrap:"wrap", margin:"16px auto 0", padding:"0 20px" }}>
        {[
          { l:"Hard Filter",   s:"Rule-Based Safety", c:C.orange },
          { l:"SBERT",         s:"all-MiniLM-L6-v2",  c:C.teal   },
          { l:"RAG",           s:"Semantic Retrieval", c:C.blue   },
          { l:"Claude LLM",    s:"Generation",         c:C.purple },
          { l:"API",           s:apiStatus === "online" ? "● Online" : "○ Offline",
            c: apiStatus === "online" ? C.green : C.red },
        ].map(b => (
          <div key={b.l} style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${b.c}30`,
                                  borderRadius:8, padding:"5px 12px", display:"flex", alignItems:"center", gap:7 }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:b.c, display:"block", boxShadow:`0 0 6px ${b.c}` }}/>
            <span style={{ fontSize:"11px", color:b.c, fontWeight:600 }}>{b.l}</span>
            <span style={{ fontSize:"10px", color:C.muted }}>{b.s}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", maxWidth:500, margin:"22px auto 0",
                    background:"rgba(255,255,255,0.02)", borderRadius:12, padding:4 }}>
        {[["profile","👤 Profile"],["cook","🍳 Cook"],["pipeline","🧠 Pipeline"]].map(([t,l]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex:1, padding:"9px", border:"none", borderRadius:9, fontFamily:"inherit",
            background: tab === t ? `${C.blue}18` : "transparent",
            borderBottom: tab === t ? `2px solid ${C.blue}` : "2px solid transparent",
            color: tab === t ? C.blue : C.muted,
            fontSize:"12px", cursor:"pointer", fontWeight: tab === t ? 600 : 400, transition:"all 0.18s",
          }}>{l}</button>
        ))}
      </div>

      <div style={{ maxWidth:860, margin:"0 auto", padding:"22px 20px 80px" }}>

        {/* ══════════ PROFILE TAB ══════════ */}
        {tab === "profile" && (
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:24 }}>
            <div style={{ fontSize:"9.5px", color:C.orange, letterSpacing:"0.14em", marginBottom:18 }}>
              ── STATIC INPUTS — used in hard filter AND LLM prompt ──
            </div>

            {/* Allergy summary at top */}
            {activeAllergies.length > 0 && (
              <div style={{ background:`${C.red}08`, border:`1px solid ${C.red}25`,
                            borderRadius:10, padding:"10px 14px", marginBottom:14 }}>
                <div style={{ fontSize:"9.5px", color:C.red, letterSpacing:"0.12em", marginBottom:6 }}>
                  🚫 ACTIVE ALLERGY BLOCKS — these will hard-filter recipes
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {activeAllergies.map(a => <AllergenTag key={a} label={a} />)}
                </div>
              </div>
            )}

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div><Lbl>AGE</Lbl><Input value={profile.age} onChange={v => setProfile(p=>({...p,age:v}))} placeholder="e.g. 24" type="number"/></div>
              <div><Lbl>GENDER</Lbl><Select value={profile.gender} onChange={v => setProfile(p=>({...p,gender:v}))} options={GENDERS} placeholder="Select gender"/></div>
              <div><Lbl>HEIGHT (cm)</Lbl><Input value={profile.height_cm} onChange={v => setProfile(p=>({...p,height_cm:v}))} placeholder="e.g. 165" type="number"/></div>
              <div><Lbl>WEIGHT (kg)</Lbl><Input value={profile.weight_kg} onChange={v => setProfile(p=>({...p,weight_kg:v}))} placeholder="e.g. 60" type="number"/></div>
            </div>

            <Lbl c={C.teal}>ACTIVITY LEVEL</Lbl>
            <Chips options={ACTIVITY_LVL} selected={profile.activity_level} color={C.teal}
              onChange={v => setProfile(p=>({...p,activity_level:v}))} />

            <Lbl c={C.green}>FITNESS GOAL</Lbl>
            <Chips options={FITNESS_GOALS} selected={profile.fitness_goal} color={C.green}
              onChange={v => setProfile(p=>({...p,fitness_goal:v}))} />

            <Lbl c={C.gold}>DIETARY PREFERENCE</Lbl>
            <Chips options={DIET_OPTIONS} selected={profile.dietary_preference} color={C.gold}
              onChange={v => setProfile(p=>({...p,dietary_preference:v}))} />

            <Lbl c={C.orange}>
              HEALTH CONDITIONS
              <span style={{ color:C.muted, fontWeight:400 }}> — blocks incompatible recipes at filter stage</span>
            </Lbl>
            <Chips options={HEALTH_CONDS} selected={profile.health_conditions} color={C.orange}
              multi onChange={v => setProfile(p=>({...p,health_conditions:v}))} />

            <Lbl c={C.red}>
              ALLERGIES
              <span style={{ color:C.muted, fontWeight:400 }}> — HARD BLOCKED before any AI runs</span>
            </Lbl>
            <Chips options={ALLERGIES} selected={profile.allergies} color={C.red}
              multi onChange={v => setProfile(p=>({...p,allergies:v}))} />

            <div style={{ background:`${C.blue}07`, border:`1px solid ${C.blue}20`,
                          borderRadius:10, padding:"12px 16px", marginTop:18, fontSize:"11px", color:C.muted, lineHeight:1.7 }}>
              <strong style={{ color:C.blue }}>How static factors are used:</strong><br/>
              <strong style={{ color:C.red }}>Allergies</strong> → Hard filter Stage 1: recipe is eliminated if allergen matches, before AI<br/>
              <strong style={{ color:C.orange }}>Health conditions</strong> → Hard filter Stage 1: blocks incompatible health tags + ingredients<br/>
              <strong style={{ color:C.gold }}>Diet preference</strong> → Hard filter Stage 1: checks diet tags + ingredient exclusion rules<br/>
              <strong style={{ color:C.green }}>Fitness goal</strong> → Soft bonus Stage 2: added to SBERT score to rank relevant recipes higher<br/>
              <strong style={{ color:C.teal }}>All factors</strong> → Also injected into Claude prompt for personalized recipe generation
            </div>

            <button onClick={() => { setProfileSaved(true); setTab("cook"); }} style={{
              width:"100%", marginTop:20, padding:"14px",
              background:`linear-gradient(135deg, ${C.blue}, ${C.teal})`,
              border:"none", borderRadius:12, color:"#fff",
              fontSize:"13px", fontWeight:700, cursor:"pointer", fontFamily:"inherit",
            }}>
              SAVE PROFILE → START COOKING
            </button>
          </div>
        )}

        {/* ══════════ COOK TAB ══════════ */}
        {tab === "cook" && (
          <div>
            {!profileSaved && (
              <div style={{ background:`${C.gold}09`, border:`1px dashed ${C.gold}33`, borderRadius:10,
                            padding:"10px 14px", marginBottom:14, fontSize:"12px", color:C.muted }}>
                ⚠ Profile not saved —{" "}
                <span style={{ color:C.gold, cursor:"pointer" }} onClick={() => setTab("profile")}>complete it for safe filtering</span>
              </div>
            )}

            {/* Active filter summary */}
            {(activeAllergies.length > 0 || activeConditions.length > 0) && (
              <div style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${C.border}`,
                            borderRadius:10, padding:"10px 14px", marginBottom:14,
                            display:"flex", flexWrap:"wrap", gap:8, alignItems:"center" }}>
                <span style={{ fontSize:"10px", color:C.muted }}>ACTIVE FILTERS:</span>
                {activeAllergies.map(a => <AllergenTag key={a} label={`No ${a}`} />)}
                {activeConditions.map(c => (
                  <span key={c} style={{ background:`${C.orange}14`, border:`1px solid ${C.orange}33`,
                                         borderRadius:12, padding:"3px 10px",
                                         fontSize:"11px", color:C.orange }}>⚕ {c}</span>
                ))}
              </div>
            )}

            {/* Filter stats if available */}
            {filterStats && <FilterBar {...filterStats} />}

            {/* Dynamic inputs */}
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:24, marginBottom:20 }}>
              <div style={{ fontSize:"9.5px", color:C.teal, letterSpacing:"0.14em", marginBottom:18 }}>
                ── DYNAMIC INPUTS — SBERT-encoded each request ──
              </div>

              <Lbl c={C.teal}>AVAILABLE INGREDIENTS *</Lbl>
              <textarea style={{ width:"100%", boxSizing:"border-box", background:"rgba(255,255,255,0.03)",
                                 border:`1px solid ${C.border}`, borderRadius:9, padding:"10px 13px",
                                 color:C.text, fontSize:"13px", ...mono, minHeight:80, resize:"vertical",
                                 lineHeight:1.6, outline:"none" }}
                placeholder="e.g. chicken, spinach, garlic, tomatoes, lemon, olive oil..."
                value={ingredients} onChange={e => setIngredients(e.target.value)} />
              <div style={{ fontSize:"9.5px", color:C.muted, marginTop:4 }}>
                Will be SBERT-encoded → cosine similarity on ALLERGEN-SAFE recipe pool only
              </div>

              <Lbl c={C.green}>MEAL TYPE *</Lbl>
              <Chips options={MEAL_TYPES} selected={mealType} color={C.green}
                onChange={v => { setMealType(v); }} />

              <Lbl c={C.muted}>SERVINGS</Lbl>
              <Chips options={["1","2","3","4","6"]} selected={servings} color={C.blue}
                onChange={setServings} />

              <div style={{ display:"flex", gap:10, marginTop:20 }}>
                <button onClick={previewFilter} disabled={!mealType}
                  style={{ padding:"12px 18px", borderRadius:10,
                           background:"rgba(255,255,255,0.03)", border:`1px solid ${C.border}`,
                           color: mealType ? C.orange : C.muted, fontSize:"12px",
                           cursor: mealType ? "pointer" : "not-allowed", fontFamily:"inherit" }}>
                  👁 Preview Filter
                </button>

                <button onClick={generate} disabled={loading || !ingredients.trim() || !mealType}
                  style={{ flex:1, padding:"14px",
                           background: loading ? `${C.blue}18` : `linear-gradient(135deg, ${C.blue}, ${C.teal})`,
                           border: loading ? `1px solid ${C.blue}33` : "none",
                           borderRadius:12, color: loading ? C.blue : "#fff",
                           fontSize:"13px", fontWeight:700,
                           cursor: loading ? "not-allowed" : "pointer",
                           fontFamily:"inherit", letterSpacing:"0.05em" }}>
                  {loading ? "⚙ RUNNING PIPELINE..." : "🧠 GENERATE SAFE RECIPES"}
                </button>
              </div>

              {/* Filter preview panel */}
              {filterPreview && (
                <div style={{ marginTop:14, background:`${C.orange}07`, border:`1px solid ${C.orange}22`,
                              borderRadius:10, padding:"12px 16px" }}>
                  <div style={{ fontSize:"9.5px", color:C.orange, letterSpacing:"0.12em", marginBottom:8 }}>
                    FILTER PREVIEW — before generation
                  </div>
                  <FilterBar total={filterPreview.total} safe={filterPreview.safe} rejected={filterPreview.rejected} />
                  <div style={{ fontSize:"11px", color:C.muted }}>
                    First 3 rejected:
                    {filterPreview.rejection_log?.slice(0,3).map((r,i) => (
                      <div key={i} style={{ marginTop:5, color:C.red }}>
                        • {r.name}: {r.reasons?.[0]}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Recipe Results */}
            {recipes.length > 0 && (
              <div>
                {/* SBERT matches */}
                {sbertMatches.length > 0 && (
                  <div style={{ background:`${C.teal}07`, border:`1px solid ${C.teal}22`,
                                borderRadius:10, padding:"10px 14px", marginBottom:14 }}>
                    <div style={{ fontSize:"9.5px", color:C.teal, letterSpacing:"0.12em", marginBottom:5 }}>
                      SBERT SEMANTIC MATCHES (from safe pool only)
                    </div>
                    {sbertMatches.map((m,i) => (
                      <div key={i} style={{ fontSize:"11px", color:C.muted, marginBottom:2 }}>{i+1}. {m}</div>
                    ))}
                  </div>
                )}

                {/* Rejection log toggle */}
                {rejectionLog.length > 0 && (
                  <div style={{ marginBottom:14 }}>
                    <button onClick={() => setShowRejections(!showRejections)} style={{
                      background:`${C.red}08`, border:`1px solid ${C.red}25`,
                      borderRadius:9, padding:"8px 14px", color:C.red, fontSize:"11px",
                      cursor:"pointer", fontFamily:"inherit",
                    }}>
                      {showRejections ? "▲ Hide" : "▼ Show"} Hard Filter Rejections ({rejectionLog.length} recipes blocked)
                    </button>

                    {showRejections && (
                      <div style={{ marginTop:10, background:"rgba(248,113,113,0.04)", border:`1px solid ${C.red}18`,
                                    borderRadius:10, padding:"12px 16px", maxHeight:200, overflowY:"auto" }}>
                        {rejectionLog.map((r,i) => (
                          <div key={i} style={{ marginBottom:8, fontSize:"11px" }}>
                            <span style={{ color:C.red }}>❌ {r.name}</span>
                            <span style={{ color:C.muted }}> — {r.reasons?.[0]}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Recipe tabs */}
                <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
                  {recipes.map((r,i) => (
                    <button key={i} onClick={() => setActiveRecipe(i)} style={{
                      flex:1, minWidth:120, padding:"10px 12px", borderRadius:10, fontFamily:"inherit",
                      border: activeRecipe === i ? `1.5px solid ${C.blue}` : `1px solid ${C.border}`,
                      background: activeRecipe === i ? `${C.blue}12` : "rgba(255,255,255,0.01)",
                      color: activeRecipe === i ? C.blue : C.muted, fontSize:"12px", cursor:"pointer",
                    }}>
                      <div style={{ fontWeight:600 }}>{r.name}</div>
                      <div style={{ fontSize:"10px", opacity:0.7, marginTop:2 }}>
                        SBERT: {(r.sbert_score * 100).toFixed(0)}% | Score: {r.health_score}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Recipe card */}
                {(() => {
                  const r = recipes[activeRecipe];
                  if (!r) return null;
                  return (
                    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:24 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
                                    flexWrap:"wrap", gap:12, marginBottom:14 }}>
                        <div>
                          <h2 style={{ fontFamily:"'Fraunces', serif", fontSize:"1.5rem", margin:"0 0 4px", color:C.text }}>{r.name}</h2>
                          <div style={{ fontSize:"12px", color:C.muted, fontStyle:"italic" }}>{r.tagline}</div>
                        </div>
                        <div style={{ background: r.health_score >= 80 ? `${C.green}12` : `${C.gold}12`,
                                      border:`1px solid ${r.health_score >= 80 ? C.green : C.gold}40`,
                                      borderRadius:10, padding:"8px 14px", textAlign:"center" }}>
                          <div style={{ fontSize:"22px", fontWeight:700,
                                        color: r.health_score >= 80 ? C.green : C.gold }}>{r.health_score}</div>
                          <div style={{ fontSize:"9px", color:C.muted }}>HEALTH SCORE</div>
                        </div>
                      </div>

                      {/* Filter provenance */}
                      <div style={{ background:`${C.green}08`, border:`1px solid ${C.green}22`,
                                    borderRadius:8, padding:"8px 12px", marginBottom:12,
                                    fontSize:"11px", color:C.green }}>
                        ✅ This recipe passed all hard filters:
                        {activeAllergies.length > 0 && ` no ${activeAllergies.join(", ")};`}
                        {` diet: ${profile.dietary_preference || "omnivore"};`}
                        {activeConditions.length > 0 && ` safe for ${activeConditions.join(", ")}`}
                        {" | "}SBERT similarity: {(r.sbert_score*100).toFixed(1)}%
                        {" + "}fitness bonus: +{(r.fitness_bonus*100).toFixed(1)}%
                      </div>

                      {/* Macros */}
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8, marginBottom:14 }}>
                        {[
                          { l:"Calories", v:r.nutrition.calories, c:C.gold },
                          { l:"Protein",  v:r.nutrition.protein,  c:C.blue },
                          { l:"Carbs",    v:r.nutrition.carbs,    c:C.teal },
                          { l:"Fats",     v:r.nutrition.fats,     c:C.green },
                          { l:"Fiber",    v:r.nutrition.fiber,    c:C.orange },
                        ].map(m => (
                          <div key={m.l} style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${m.c}18`,
                                                  borderRadius:9, padding:"9px", textAlign:"center" }}>
                            <div style={{ fontSize:"14px", fontWeight:700, color:m.c }}>{m.v}</div>
                            <div style={{ fontSize:"9px", color:C.muted, marginTop:2 }}>{m.l}</div>
                          </div>
                        ))}
                      </div>

                      {/* Meta */}
                      <div style={{ display:"flex", gap:16, flexWrap:"wrap", fontSize:"11px", color:C.muted, marginBottom:14 }}>
                        <span>⏱ Prep: {r.prep_time}</span>
                        <span>🔥 Cook: {r.cook_time}</span>
                        <span>📊 {r.difficulty}</span>
                        <span>🍽 {servings} servings</span>
                      </div>

                      {/* AI Note */}
                      <div style={{ background:`${C.purple}09`, border:`1px solid ${C.purple}22`,
                                    borderRadius:9, padding:"10px 14px", marginBottom:10 }}>
                        <div style={{ fontSize:"9.5px", color:C.purple, letterSpacing:"0.1em", marginBottom:4 }}>🧠 LLM PERSONALIZATION</div>
                        <div style={{ fontSize:"12px", color:C.soft, lineHeight:1.6 }}>{r.ai_note}</div>
                      </div>

                      {/* Goal alignment */}
                      <div style={{ background:`${C.green}07`, border:`1px solid ${C.green}20`,
                                    borderRadius:9, padding:"10px 14px", marginBottom:10 }}>
                        <div style={{ fontSize:"9.5px", color:C.green, letterSpacing:"0.1em", marginBottom:4 }}>🎯 GOAL: {(profile.fitness_goal || "Maintenance").toUpperCase()}</div>
                        <div style={{ fontSize:"12px", color:C.soft, lineHeight:1.6 }}>{r.goal_alignment}</div>
                      </div>

                      {/* Warnings */}
                      {r.warnings?.length > 0 && r.warnings[0] && (
                        <div style={{ background:`${C.red}07`, border:`1px solid ${C.red}20`,
                                      borderRadius:9, padding:"10px 14px", marginBottom:10 }}>
                          <div style={{ fontSize:"9.5px", color:C.red, letterSpacing:"0.1em", marginBottom:4 }}>⚠ HEALTH NOTES</div>
                          {r.warnings.map((w,i) => <div key={i} style={{ fontSize:"12px", color:"#FCA5A5" }}>• {w}</div>)}
                        </div>
                      )}

                      {/* Ingredients */}
                      <div style={{ marginBottom:14 }}>
                        <div style={{ fontSize:"9.5px", color:C.muted, letterSpacing:"0.1em", marginBottom:8 }}>INGREDIENTS</div>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                          {r.ingredients.map((ing,i) => (
                            <div key={i} style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${C.border}`,
                                                  borderRadius:8, padding:"6px 12px", fontSize:"12px", color:C.soft }}>• {ing}</div>
                          ))}
                        </div>
                      </div>

                      {/* Steps */}
                      <div style={{ fontSize:"9.5px", color:C.muted, letterSpacing:"0.1em", marginBottom:8 }}>STEPS</div>
                      {r.steps.map((step,i) => (
                        <div key={i} style={{ display:"flex", gap:12, padding:"9px 12px", borderRadius:8, marginBottom:6,
                                              background:"rgba(255,255,255,0.01)", border:`1px solid ${C.border}` }}>
                          <div style={{ minWidth:24, height:24, borderRadius:"50%",
                                        background:`${C.blue}18`, border:`1px solid ${C.blue}44`,
                                        display:"flex", alignItems:"center", justifyContent:"center",
                                        fontSize:"11px", color:C.blue, fontWeight:700 }}>{i+1}</div>
                          <div style={{ fontSize:"13px", color:C.soft, lineHeight:1.5 }}>{step}</div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ══════════ PIPELINE TAB ══════════ */}
        {tab === "pipeline" && (
          <div>
            {/* Architecture */}
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:24, marginBottom:18 }}>
              <div style={{ fontSize:"9.5px", color:C.blue, letterSpacing:"0.14em", marginBottom:20 }}>
                ── BELLYBOT v2: FILTER-FIRST ARCHITECTURE ──
              </div>

              {[
                { n:"1", color:C.orange, title:"HARD FILTER — Rule-Based Safety",
                  sub:"Deterministic | Runs before any AI",
                  points:[
                    "Allergen check: recipe.allergens ∩ user.allergies → reject (FAO/WHO Top-14)",
                    "Diet tag check: recipe.diet_tags must include user's diet requirement",
                    "Ingredient exclusion: ingredient keywords blocked per diet (e.g. vegan blocks 'egg')",
                    "Health condition: diabetes blocks 'high-sugar' tags; celiac requires 'gluten-free'",
                    "Meal type: recipe.meal_types must include requested meal type",
                  ],
                  why:"WHY FIRST: Allergen safety MUST be guaranteed, not probabilistic. No AI model should be trusted alone for safety-critical decisions. Hard filter = 100% auditable.",
                },
                { n:"2", color:C.teal, title:"SBERT ENCODING + SEMANTIC SEARCH",
                  sub:"sentence-transformers/all-MiniLM-L6-v2 | Runs on safe pool only",
                  points:[
                    "Query = ingredients + meal type + diet preference (concatenated string)",
                    "SBERT encodes query → 384-dim embedding vector",
                    "Cosine similarity computed against pre-embedded safe pool only",
                    "Fitness goal bonus (+0–0.3) added to similarity score for preferred health tags",
                    "Top-3 recipes selected by (cosine_sim + fitness_bonus) combined score",
                  ],
                  why:"WHY SBERT: Keyword search misses 'marinara spaghetti' for 'tomato pasta'. Semantic embeddings capture meaning. Running on safe pool ensures retrieved context never contains allergens.",
                },
                { n:"3", color:C.purple, title:"RAG PROMPT + CLAUDE GENERATION",
                  sub:"Claude claude-sonnet-4-20250514 | Retrieval-Augmented Generation",
                  points:[
                    "SBERT top-3 matches injected as grounding context (RAG)",
                    "Full health profile (BMI, conditions, allergies, goal) added to prompt",
                    "Claude explicitly told all allergen/diet filtering already happened",
                    "Claude generates 3 personalized recipes with macros, steps, health score",
                    "Output parsed into structured JSON with Pydantic validation",
                  ],
                  why:"WHY CLAUDE AFTER FILTER: LLM handles nuance (sodium advice for hypertension, macro adaptation for diabetes) that rule-based systems can't. But safety rules run first.",
                },
              ].map((s, i, arr) => (
                <div key={s.n} style={{ display:"flex", gap:16, marginBottom: i<arr.length-1 ? 18:0 }}>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                    <div style={{ width:32, height:32, minWidth:32, borderRadius:"50%",
                                  background:`${s.color}12`, border:`1.5px solid ${s.color}55`,
                                  display:"flex", alignItems:"center", justifyContent:"center",
                                  fontSize:"13px", fontWeight:700, color:s.color }}>{s.n}</div>
                    {i<arr.length-1 && <div style={{ width:1, flex:1, background:`${s.color}20`, margin:"4px 0" }}/>}
                  </div>
                  <div style={{ flex:1, paddingTop:4 }}>
                    <div style={{ color:s.color, fontSize:"12px", fontWeight:600 }}>{s.title}</div>
                    <div style={{ fontSize:"9.5px", color:C.muted, marginBottom:8 }}>{s.sub}</div>
                    {s.points.map((p,pi) => (
                      <div key={pi} style={{ fontSize:"11px", color:"#64748B", lineHeight:1.7 }}>→ {p}</div>
                    ))}
                    <div style={{ background:`${s.color}07`, border:`1px solid ${s.color}20`,
                                  borderRadius:8, padding:"8px 12px", marginTop:8,
                                  fontSize:"11px", color:"#4B5563" }}>💡 {s.why}</div>
                  </div>
                </div>
              ))}

              {/* Dataset info */}
              <div style={{ marginTop:20, borderTop:`1px solid ${C.border}`, paddingTop:18 }}>
                <div style={{ fontSize:"9.5px", color:C.muted, letterSpacing:"0.1em", marginBottom:10 }}>
                  DATASET SOURCES FOR YOUR REPORT
                </div>
                {[
                  { name:"Our Curated Dataset (this project)", n:"80 recipes", desc:"JSON with allergens, diet tags, health tags, fitness tags. Domain-specific, manually verified.", c:C.green },
                  { name:"RecipeNLG", n:"2.2M recipes", desc:"github.com/Glorf/recipenlg — Large open recipe dataset for fine-tuning SBERT at scale", c:C.blue },
                  { name:"USDA FoodData Central", n:"API", desc:"fdc.nal.usda.gov — Official nutritional data per ingredient (calories, protein, fiber)", c:C.gold },
                  { name:"FAO/WHO Top-14 Allergens", n:"Standard", desc:"Standard used for allergen labelling: milk, eggs, fish, shellfish, nuts, peanuts, wheat, soy, sesame...", c:C.orange },
                  { name:"Open Food Facts", n:"3M products", desc:"world.openfoodfacts.org — Ingredient + allergen data for real packaged foods", c:C.purple },
                ].map(d => (
                  <div key={d.name} style={{ display:"flex", gap:12, alignItems:"flex-start", marginBottom:10,
                                             padding:"8px 12px", background:"rgba(255,255,255,0.01)",
                                             border:`1px solid ${d.c}15`, borderRadius:8 }}>
                    <div style={{ minWidth:8, height:8, borderRadius:"50%", background:d.c, marginTop:5 }}/>
                    <div>
                      <span style={{ fontSize:"12px", color:d.c, fontWeight:600 }}>{d.name}</span>
                      <span style={{ fontSize:"10px", color:C.muted }}> ({d.n})</span>
                      <div style={{ fontSize:"11px", color:"#475569", marginTop:2 }}>{d.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live log */}
            <div style={{ background:"rgba(0,0,0,0.45)", border:`1px solid ${C.green}18`, borderRadius:16, padding:18 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <div style={{ fontSize:"9.5px", color:C.green, letterSpacing:"0.14em" }}>⚙ LIVE PIPELINE LOG</div>
                {pipelineLog.length > 0 && (
                  <button onClick={() => setPipelineLog([])} style={{
                    background:"none", border:`1px solid ${C.border}`,
                    borderRadius:6, color:C.muted, fontSize:"10px",
                    padding:"3px 8px", cursor:"pointer", fontFamily:"inherit",
                  }}>CLEAR</button>
                )}
              </div>
              <div ref={logRef} style={{ maxHeight:320, overflowY:"auto" }}>
                {pipelineLog.length === 0 ? (
                  <div style={{ color:"#1E293B", fontSize:"12px", textAlign:"center", padding:"28px 0" }}>
                    Generate recipes on the Cook tab to see the live pipeline...
                  </div>
                ) : pipelineLog.map((e, i) => (
                  <div key={i} style={{ display:"flex", gap:10, padding:"4px 0",
                                        borderBottom:"1px solid rgba(255,255,255,0.02)" }}>
                    <span style={{ fontSize:"9px", color:"#1E293B", minWidth:68, paddingTop:2 }}>{e.ts}</span>
                    <span style={{ fontSize:"9px", fontWeight:700, minWidth:48, paddingTop:2,
                                   color:phaseStyle[e.phase]||C.muted }}>[{phaseLabel[e.phase]||e.phase}]</span>
                    <span style={{ fontSize:"11px", color: e.phase==="err" ? C.red : "#64748B",
                                   whiteSpace:"pre-wrap", lineHeight:1.5 }}>{e.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
