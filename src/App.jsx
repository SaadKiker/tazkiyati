import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment } from '@react-three/drei'
import { useRef, useState, useEffect } from 'react'
import { supabase } from './supabase'
import Auth from './Auth'

// Base values are on a realistic scale.
// Good deeds use diminishing returns: Δp = baseValue × severity × (1 − purity/100)
// This means reaching 80%+ takes months of consistent practice.
// Bad deeds are linear — full impact always, because you always have something to lose.
const DEEDS = {
  good: [
    { label: 'صلاة', sublabel: 'Salah', value: 2.0 },
    { label: 'زكاة', sublabel: 'Zakat', value: 2.5 },
    { label: 'حج', sublabel: 'Hajj', value: 5.0 },
    { label: 'قيام الليل', sublabel: 'Qiyam al-Layl', value: 1.8 },
    { label: 'صلاة الجماعة', sublabel: 'Congregational Prayer', value: 1.0 },
    { label: 'تلاوة القرآن', sublabel: 'Quran Recitation', value: 1.5 },
    { label: 'ذكر الله', sublabel: 'Dhikr', value: 0.8 },
    { label: 'دعاء', sublabel: 'Duaa', value: 0.6 },
    { label: 'صدقة', sublabel: 'Sadaqah', value: 1.2 },
    { label: 'صوم النافلة', sublabel: 'Voluntary Fasting', value: 1.5 },
    { label: 'عيادة المريض', sublabel: 'Visiting the Sick', value: 1.0 },
    { label: 'إطعام الطعام', sublabel: 'Feeding Others', value: 1.0 },
    { label: 'صدق', sublabel: 'Honesty', value: 0.8 },
    { label: 'صبر', sublabel: 'Patience', value: 0.7 },
    { label: 'كرم', sublabel: 'Generosity', value: 0.6 },
    { label: 'رحمة', sublabel: 'Compassion', value: 0.6 },
    { label: 'طلب العلم', sublabel: 'Seeking Knowledge', value: 0.9 },
    { label: 'بر الوالدين', sublabel: 'Honoring Parents', value: 1.5 },
    { label: 'غض البصر', sublabel: 'Lowering the Gaze', value: 0.8 },
    { label: 'إصلاح ذات البين', sublabel: 'Reconciliation', value: 1.0 },
    { label: 'حسن الخلق', sublabel: 'Good Character', value: 0.8 },
  ],
  bad: [
    { label: 'ترك الصلاة', sublabel: 'Missing Prayer', value: -4.0 },
    { label: 'عقوق الوالدين', sublabel: 'Disrespecting Parents', value: -4.0 },
    { label: 'غيبة', sublabel: 'Backbiting', value: -1.5 },
    { label: 'كذب', sublabel: 'Lying', value: -1.5 },
    { label: 'نميمة', sublabel: 'Tale-Bearing', value: -1.8 },
    { label: 'مشاهدة الحرام', sublabel: 'Watching Haram', value: -2.0 },
    { label: 'غضب', sublabel: 'Anger', value: -1.0 },
    { label: 'غفلة', sublabel: 'Heedlessness', value: -0.6 },
    { label: 'إهدار الوقت', sublabel: 'Wasting Time', value: -0.5 },
    { label: 'سوء الكلام', sublabel: 'Bad Speech', value: -1.0 },
    { label: 'كبر', sublabel: 'Arrogance', value: -2.0 },
    { label: 'حسد', sublabel: 'Envy', value: -1.2 },
    { label: 'فحش', sublabel: 'Obscenity', value: -1.5 },
  ]
}

const SEVERITY = [
  { label: 'Light', multiplier: 0.5 },
  { label: 'Moderate', multiplier: 1 },
  { label: 'Strong', multiplier: 2 },
]

function Modal({ onClose, onLog, purity }) {
  const [tab, setTab] = useState('good')
  const [selectedDeed, setSelectedDeed] = useState(null)

  const handleDeedClick = (deed) => {
    setSelectedDeed(deed)
  }

  // Good deeds use diminishing returns so high purity takes months to reach.
  // Bad deeds are always full impact — you always have something to lose.
  const calcDelta = (deed, severityMultiplier) => {
    const base = deed.value * severityMultiplier
    if (base > 0) return base * (1 - purity / 100)
    return base
  }

  const handleSeverityClick = (severity) => {
    const finalValue = calcDelta(selectedDeed, severity.multiplier)
    onLog({ ...selectedDeed, value: finalValue, severity: severity.label })
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(247,244,240,0.85)', backdropFilter: 'blur(12px)'
    }}>
      <div className="card" style={{
        background: 'rgba(255,255,255,0.9)',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: '24px',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
        transition: 'all 0.3s'
      }}>

        {!selectedDeed ? (
          <>
            {/* Title */}
            <p style={{ fontSize: '11px', letterSpacing: '4px', color: '#999', textTransform: 'uppercase', margin: '0 0 24px' }}>
              Log a Deed
            </p>

            {/* Tabs */}
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.04)', borderRadius: '50px', padding: '4px', marginBottom: '28px' }}>
              {['good', 'bad'].map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  flex: 1, padding: '8px', border: 'none', borderRadius: '50px', cursor: 'pointer',
                  fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase',
                  background: tab === t ? '#fff' : 'transparent',
                  color: tab === t ? '#2a2a2a' : '#999',
                  boxShadow: tab === t ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.2s'
                }}>
                  {t === 'good' ? 'Good' : 'Bad'}
                </button>
              ))}
            </div>

            {/* Deeds */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px', maxHeight: '340px', overflowY: 'auto' }}>
              {DEEDS[tab].map((deed) => (
                <button key={deed.label} onClick={() => handleDeedClick(deed)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 18px', border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: '14px', background: 'transparent', cursor: 'pointer',
                  transition: 'all 0.2s', textAlign: 'left', flexShrink: 0
                }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.03)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div>
                    <div style={{ fontSize: '17px', color: '#2a2a2a', fontWeight: '500' }}>{deed.sublabel}</div>
                    <div style={{ fontSize: '11px', color: '#aaa', letterSpacing: '0.5px', marginTop: '2px' }}>{deed.label}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Close */}
            <button onClick={onClose} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '11px', letterSpacing: '3px', color: '#bbb', textTransform: 'uppercase'
            }}>
              Close
            </button>
          </>
        ) : (
          <>
            {/* Selected deed title */}
            <h2 style={{ fontSize: '28px', color: '#2a2a2a', margin: '0 0 4px' }}>
              {selectedDeed.sublabel}
            </h2>
            <p style={{ fontSize: '13px', color: '#aaa', margin: '0 0 6px' }}>
              {selectedDeed.label}
            </p>
            <p style={{ fontSize: '11px', letterSpacing: '3px', color: '#bbb', textTransform: 'uppercase', margin: '0 0 28px' }}>
              How severe?
            </p>

            {/* Severity options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
              {SEVERITY.map((s) => {
                const delta = calcDelta(selectedDeed, s.multiplier)
                const isGood = delta > 0
                return (
                  <button key={s.label} onClick={() => handleSeverityClick(s)} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 20px', border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: '14px', background: 'transparent', cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.03)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontSize: '13px', letterSpacing: '2px', color: '#2a2a2a', textTransform: 'uppercase' }}>{s.label}</span>
                    <span style={{ fontSize: '12px', color: isGood ? '#7a9e7e' : '#c47a7a', fontWeight: '500' }}>
                      {isGood ? `+${delta.toFixed(2)}%` : `${delta.toFixed(2)}%`}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Back */}
            <button onClick={() => setSelectedDeed(null)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '11px', letterSpacing: '3px', color: '#bbb', textTransform: 'uppercase'
            }}>
              Back
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function Heart({ onClick, onHoverChange, purity, yOffset = 0 }) {
  const { scene } = useGLTF('/heart.glb')
  const ref = useRef()
  const [hovered, setHovered] = useState(false)
  const uniformsRef = useRef({ uPurity: { value: purity / 100 } })

  useEffect(() => {
    uniformsRef.current.uPurity.value = purity / 100
  }, [purity])

  useEffect(() => {
    scene.traverse((child) => {
      if (!child.isMesh) return
      const mat = child.material.clone()

      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uPurity = uniformsRef.current.uPurity

        // Pass local position from vertex shader (rotates with the mesh)
        shader.vertexShader = shader.vertexShader.replace(
          '#include <common>',
          `#include <common>
          varying vec3 vLocalPos;`
        )
        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
          vLocalPos = position;`
        )

        // Inject noise + corruption into fragment shader
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <common>',
          `#include <common>
          uniform float uPurity;
          varying vec3 vLocalPos;

          float h3(vec3 p) {
            p = fract(p * vec3(0.1031, 0.1030, 0.0973));
            p += dot(p, p.yxz + 33.33);
            return fract((p.x + p.y) * p.z);
          }
          float n3(vec3 p) {
            vec3 i = floor(p); vec3 f = fract(p);
            f = f*f*(3.0-2.0*f);
            return mix(
              mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x), mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x), f.y),
              mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x), mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x), f.y),
              f.z
            );
          }
          float fbm(vec3 p) {
            float v = 0.0; float a = 0.5;
            for(int i=0;i<4;i++) { v += a*n3(p); p = p*2.0+vec3(5.2,1.3,2.8); a*=0.5; }
            return v;
          }`
        )

        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <color_fragment>',
          `#include <color_fragment>
          float corruption = 1.0 - uPurity;

          // Primary noise for corruption boundary
          float n = fbm(vLocalPos * 2.2);
          // Secondary noise for internal dark texture
          float n2 = fbm(vLocalPos * 5.5 + vec3(3.2, 1.7, 8.1));

          // Main corruption mask
          float corruptMask = 1.0 - smoothstep(corruption - 0.08, corruption + 0.08, n);

          // Edge glow: peaks right at the boundary between pure and corrupt
          float edge = corruptMask * (1.0 - corruptMask) * 4.0;
          edge = pow(clamp(edge, 0.0, 1.0), 0.7);

          // Dark base with inner texture variation
          vec3 darkBase = vec3(0.08, 0.08, 0.08);
          vec3 darkTextured = mix(darkBase, vec3(0.15, 0.15, 0.15), n2 * 0.6);

          // Glowing rim color where corruption bleeds in (deep crimson)
          vec3 rimGlow = vec3(0.55, 0.04, 0.02);

          vec3 col = diffuseColor.rgb;
          col = mix(col, darkTextured, corruptMask);
          col = mix(col, rimGlow, edge * clamp(corruption * 2.5, 0.0, 1.0));

          diffuseColor.rgb = col;`
        )
      }

      mat.needsUpdate = true
      child.material = mat
    })
  }, [scene])

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.003
      const isMobile = window.innerWidth <= 480
      const baseScale = isMobile ? 0.030 : 0.035
      const targetScale = hovered ? baseScale * 1.08 : baseScale
      ref.current.scale.setScalar(
        ref.current.scale.x + (targetScale - ref.current.scale.x) * 0.1
      )
    }
  })

  return (
    <primitive
      ref={ref}
      object={scene}
      position={[0, yOffset, 0]}
      onClick={onClick}
      onPointerOver={() => { setHovered(true); onHoverChange(true) }}
      onPointerOut={() => { setHovered(false); onHoverChange(false) }}
    />
  )
}

export default function App() {
  const [session, setSession] = useState(undefined)
  const [hovered, setHovered] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [purity, setPurity] = useState(72)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    supabase
      .from('heart_state')
      .select('purity')
      .eq('user_id', session.user.id)
      .single()
      .then(({ data }) => { if (data) setPurity(data.purity) })
  }, [session])

  const handleLog = async (deed) => {
    const newPurity = Math.min(100, Math.max(0, purity + deed.value))
    setPurity(newPurity)

    await supabase.from('heart_state').upsert({ user_id: session.user.id, purity: newPurity, updated_at: new Date().toISOString() })
  }

  if (session === undefined) return null
  if (!session) return <Auth />

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#f7f4f0', overflow: 'hidden' }}>

      {/* Background dots */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.15) 1.5px, transparent 1.5px)',
        backgroundSize: '25px 25px',
        zIndex: 0
      }} />

      {/* Soft glow orb */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '500px', height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,220,180,0.3) 0%, transparent 70%)',
        zIndex: 0
      }} />

      {/* Canvas */}
      <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: 1, cursor: hovered ? 'pointer' : 'default' }}>
        <Canvas camera={{ position: [0, 0, 5] }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 5, 5]} intensity={1} color="#fff8f0" />
          <directionalLight position={[-5, -2, -5]} intensity={0.3} color="#ffd9b0" />
          <Environment preset="sunset" />
          <Heart onClick={() => setShowModal(true)} onHoverChange={setHovered} purity={purity} yOffset={window.innerWidth <= 480 ? 0.5 : 0} />
          <OrbitControls enableZoom={false} />
        </Canvas>
      </div>

      {/* App title */}
      <div style={{
        position: 'absolute', top: '24px', left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 2, textAlign: 'center'
      }}>
        <h1 className="app-title">TAZKIYATI</h1>
        <p className="app-subtitle">heart purity tracker</p>
      </div>

      {/* Sign out */}
      <button onClick={() => supabase.auth.signOut()} style={{
        position: 'absolute', top: '20px', right: '16px', zIndex: 2,
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: '10px', letterSpacing: '3px', color: '#bbb', textTransform: 'uppercase',
        padding: '8px'
      }}>
        Sign Out
      </button>

      {/* Purity score */}
      <div className="purity-display" style={{
        position: 'absolute', left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 2, textAlign: 'center'
      }}>
        <p style={{ fontSize: '11px', letterSpacing: '4px', color: '#999', margin: 0, textTransform: 'uppercase' }}>Heart Purity</p>
        <h2 style={{ fontSize: '48px', color: '#2a2a2a', margin: '4px 0' }}>{Math.round(purity)}%</h2>
      </div>

      {showModal && <Modal onClose={() => setShowModal(false)} onLog={handleLog} purity={purity} />}

    </div>
  )
}