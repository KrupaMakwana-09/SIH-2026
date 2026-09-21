import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Sparkles, Volume2, CheckCircle2, AlertCircle, X, Languages, Zap } from 'lucide-react';
import { api } from '../utils/api';
export default function VoiceModal({
  isOpen,
  onClose,
  onTriageComplete
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [selectedLang, setSelectedLang] = useState('hi-IN');
  const [loading, setLoading] = useState(false);
  const [triageResult, setTriageResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const recognitionRef = useRef(null);

  // Quick simulation scenarios for SIH demo presentations
  const demoScenarios = [{
    title: '👶 Pediatric High Fever (Hindi)',
    lang: 'hi-IN',
    text: 'मेरे 4 साल के बच्चे को 3 दिन से बहुत तेज बुखार है और लगातार उल्टी हो रही है, बच्चा बहुत कमजोर हो गया है।'
  }, {
    title: '💔 Suspected Cardiac Emergency (Hinglish)',
    lang: 'en-IN',
    text: 'Patient ko kal raat se chhati me bohot tez dard ho raha hai aur saans lene me takleef ho rahi hai. Age 58 years.'
  }, {
    title: '🤰 High Risk Pregnancy (Hindi)',
    lang: 'hi-IN',
    text: 'गर्भवती महिला उम्र 28 वर्ष, 8वां महीना चल रहा है। पेट में बहुत तेज दर्द है और बीपी 150/100 बढ़ गया है।'
  }, {
    title: '🐍 Snake Bite Emergency (Hindi)',
    lang: 'hi-IN',
    text: 'खेत में काम करते हुए पैर में सांप ने काट लिया है, मरीज को चक्कर आ रहे हैं और बेहोश हो रहा है।'
  }];
  useEffect(() => {
    // Check Speech Recognition support
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = selectedLang;
      rec.onresult = event => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);
      };
      rec.onerror = e => {
        console.warn('Speech recognition error:', e);
        setIsRecording(false);
      };
      rec.onend = () => {
        setIsRecording(false);
      };
      recognitionRef.current = rec;
    }
  }, [selectedLang]);
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setErrorMsg('Speech recognition is not directly supported by this browser. Please use the preset buttons or type below.');
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setTranscript('');
      setTriageResult(null);
      setErrorMsg('');
      recognitionRef.current.lang = selectedLang;
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error(err);
      }
    }
  };
  const handleRunTriage = async textToUse => {
    const queryText = textToUse || transcript;
    if (!queryText || queryText.trim() === '') {
      setErrorMsg('Please speak or enter patient symptoms first.');
      return;
    }
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.parseVoiceTriage(queryText, selectedLang);
      if (res.success) {
        setTriageResult(res.data);
      } else {
        setErrorMsg(res.message || 'Failed to analyze symptoms.');
      }
    } catch (err) {
      setErrorMsg('Network error. Falling back to local offline parser.');
    } finally {
      setLoading(false);
    }
  };
  const handleApplyToForm = () => {
    if (triageResult && onTriageComplete) {
      onTriageComplete(triageResult);
      onClose();
    }
  };
  if (!isOpen) return null;
  return <div style={{
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  }}>
      <div className="glass-panel" style={{
      width: '100%',
      maxWidth: '720px',
      maxHeight: '90vh',
      overflowY: 'auto',
      padding: '28px',
      position: 'relative'
    }}>
        {/* Header */}
        <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
          <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
            <div style={{
            padding: '10px',
            border: "1px solid #000"
          }}>
              <Sparkles size={24} />
            </div>
            <div>
              <h2 style={{
              fontSize: '1.35rem',
              fontWeight: 800
            }}>
                Multilingual Voice AI Triage
              </h2>
              <p style={{
              fontSize: '0.82rem'
            }}>
                Speak in Hindi or regional language to automatically extract clinical vitals & triage risk.
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
          border: 'none',
          padding: '6px',
          cursor: 'pointer'
        }}>
            <X size={20} color="#4b5563" />
          </button>
        </div>

        {/* Language & Voice Controls */}
        <div style={{
        padding: '18px',
        border: "1px solid #000",
        marginBottom: '20px'
      }}>
          <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px'
        }}>
            <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.85rem',
            fontWeight: 600
          }}>
              <Languages size={16} color="#059669" />
              <span>Input Language:</span>
            </div>
            <div style={{
            display: 'flex',
            gap: '8px'
          }}>
              <button type="button" onClick={() => setSelectedLang('hi-IN')} style={{
              padding: '5px 12px',
              border: selectedLang === 'hi-IN' ? '2px solid #059669' : '1px solid #d1d5db',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}>
                🇮🇳 हिन्दी (Hindi)
              </button>
              <button type="button" onClick={() => setSelectedLang('en-IN')} style={{
              padding: '5px 12px',
              border: selectedLang === 'en-IN' ? '2px solid #059669' : '1px solid #d1d5db',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}>
                English / Hinglish
              </button>
            </div>
          </div>

          {/* Big Mic Button & Live Recording Status */}
          <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px 0',
          gap: '12px'
        }}>
            <button type="button" onClick={toggleRecording} style={{
            width: '74px',
            height: '74px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: isRecording ? 'scale(1.08)' : 'scale(1)'
          }}>
              {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
            </button>
            <div style={{
            textAlign: 'center'
          }}>
              <div style={{
              fontSize: '0.9rem',
              fontWeight: 700
            }}>
                {isRecording ? '🔴 Listening... Speak patient symptoms now' : 'Click microphone to start voice recording'}
              </div>
              {isRecording && <div className="waveform-container" style={{
              justifyContent: 'center',
              marginTop: '6px'
            }}>
                  <div className="waveform-bar"></div>
                  <div className="waveform-bar"></div>
                  <div className="waveform-bar"></div>
                  <div className="waveform-bar"></div>
                  <div className="waveform-bar"></div>
                </div>}
            </div>
          </div>

          {/* Transcript input box */}
          <div>
            <label style={{
            display: 'block',
            fontSize: '0.8rem',
            fontWeight: 600,
            marginBottom: '6px'
          }}>
              Captured Voice Transcript / Manual Input:
            </label>
            <textarea rows={3} value={transcript} onChange={e => setTranscript(e.target.value)} placeholder="Speak or type clinical symptoms in Hindi, English, or Hinglish..." style={{
            width: '100%',
            padding: '12px',
            border: "1px solid #000",
            fontSize: '0.92rem',
            fontFamily: 'inherit',
            outline: 'none',
            resize: 'vertical'
          }} />
          </div>

          {/* SIH Presentation Presets */}
          <div style={{
          marginTop: '12px'
        }}>
            <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.78rem',
            fontWeight: 700,
            marginBottom: '6px'
          }}>
              <Zap size={14} />
              <span>Instant SIH Demo Scenarios (1-Click Test):</span>
            </div>
            <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '8px'
          }}>
              {demoScenarios.map((sc, idx) => <button key={idx} type="button" onClick={() => {
              setTranscript(sc.text);
              setSelectedLang(sc.lang);
              handleRunTriage(sc.text);
            }} style={{
              textAlign: 'left',
              padding: '8px 12px',
              border: "1px solid #000",
              fontSize: '0.75rem',
              cursor: 'pointer'
            }} onMouseOver={e => e.currentTarget.style.background = '#ecfdf5'} onMouseOut={e => e.currentTarget.style.background = '#ffffff'}>
                  <div style={{
                fontWeight: 700
              }}>{sc.title}</div>
                  <div style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                    "{sc.text}"
                  </div>
                </button>)}
            </div>
          </div>

          {errorMsg && <div style={{
          marginTop: '12px',
          padding: '10px',
          fontSize: '0.82rem',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>}

          <div style={{
          marginTop: '14px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px'
        }}>
            <button type="button" onClick={() => handleRunTriage(transcript)} disabled={loading || !transcript} className="btn-primary" style={{
            padding: '8px 18px',
            fontSize: '0.85rem'
          }}>
              <Sparkles size={16} />
              <span>{loading ? 'AI Analyzing Symptoms...' : 'Extract & Analyze Clinical Triage'}</span>
            </button>
          </div>
        </div>

        {/* Structured AI Triage Output */}
        {triageResult && <div style={{
        padding: '20px',
        border: `2px solid ${triageResult.triageAssessment.badgeColor}`
      }}>
            <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
              <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
                <CheckCircle2 size={20} color="#059669" />
                <span style={{
              fontSize: '1rem',
              fontWeight: 800
            }}>
                  AI Clinical Extraction Results
                </span>
              </div>
              <div style={{
            padding: '4px 14px',
            fontWeight: 800,
            fontSize: '0.82rem',
            letterSpacing: '0.04em'
          }}>
                {triageResult.triageAssessment.riskLevel} PRIORITY ({triageResult.triageAssessment.triageCategory})
              </div>
            </div>

            <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '14px'
        }}>
              <div style={{
            padding: '10px'
          }}>
                <div style={{
              fontSize: '0.72rem',
              fontWeight: 600
            }}>ESTIMATED AGE</div>
                <div style={{
              fontSize: '1.05rem',
              fontWeight: 700
            }}>{triageResult.structuredData.estimatedAge} Years</div>
              </div>
              <div style={{
            padding: '10px'
          }}>
                <div style={{
              fontSize: '0.72rem',
              fontWeight: 600
            }}>SYMPTOM DURATION</div>
                <div style={{
              fontSize: '1.05rem',
              fontWeight: 700
            }}>{triageResult.structuredData.duration}</div>
              </div>
              <div style={{
            padding: '10px'
          }}>
                <div style={{
              fontSize: '0.72rem',
              fontWeight: 600
            }}>RECOMMENDED TIER</div>
                <div style={{
              fontSize: '0.85rem',
              fontWeight: 700
            }}>{triageResult.triageAssessment.recommendedFacilityType}</div>
              </div>
            </div>

            {/* Extracted Vitals */}
            <div style={{
          padding: '12px',
          marginBottom: '14px',
          border: "1px solid #000"
        }}>
              <div style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            marginBottom: '6px'
          }}>
                📊 Extracted Baseline Vitals:
              </div>
              <div style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            fontSize: '0.85rem'
          }}>
                <span><strong>BP:</strong> {triageResult.structuredData.vitals.bp}</span>
                <span><strong>SpO2:</strong> {triageResult.structuredData.vitals.spo2}%</span>
                <span><strong>Temp:</strong> {triageResult.structuredData.vitals.temp}°F</span>
                <span><strong>Pulse:</strong> {triageResult.structuredData.vitals.pulse} bpm</span>
              </div>
            </div>

            {/* Clinical Action Note */}
            <div style={{
          padding: '12px',
          marginBottom: '14px',
          border: "1px solid #000",
          fontSize: '0.82rem'
        }}>
              <strong>Clinical Action Guidance:</strong> {triageResult.triageAssessment.actionGuidance}
            </div>

            {/* Responsible AI Notice */}
            <div style={{
          fontSize: '0.72rem',
          fontStyle: 'italic',
          marginBottom: '16px'
        }}>
              ⚠️ {triageResult.triageAssessment.responsibleAiDisclaimer}
            </div>

            {/* Apply to Patient Intake Form */}
            <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px'
        }}>
              <button type="button" onClick={onClose} className="btn-secondary">
                Close
              </button>
              <button type="button" onClick={handleApplyToForm} className="btn-primary">
                <CheckCircle2 size={16} />
                <span>Auto-Fill into Patient Registration Form</span>
              </button>
            </div>
          </div>}
      </div>
    </div>;
}