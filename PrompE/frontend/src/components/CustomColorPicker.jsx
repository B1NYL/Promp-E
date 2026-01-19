import React, { useState, useEffect, useRef } from 'react';
import { X, Check } from 'lucide-react';

const CustomColorPicker = ({ color, onChange, onClose }) => {
    const [hex, setHex] = useState(color);
    const [hsl, setHsl] = useState({ h: 0, s: 100, l: 50 });

    // Convert Hex to HSL on init
    useEffect(() => {
        setHex(color);
        const rgb = hexToRgb(color);
        if (rgb) {
            setHsl(rgbToHsl(rgb.r, rgb.g, rgb.b));
        }
    }, [color]);

    // Update Hex when HSL changes
    const handleHslChange = (key, value) => {
        const newHsl = { ...hsl, [key]: Number(value) };
        setHsl(newHsl);
        const newHex = hslToHex(newHsl.h, newHsl.s, newHsl.l);
        setHex(newHex);
        onChange(newHex);
    };

    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    };

    const rgbToHsl = (r, g, b) => {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
    };

    const hslToHex = (h, s, l) => {
        l /= 100;
        const a = s * Math.min(l, 1 - l) / 100;
        const f = n => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    };

    return (
        <div style={{
            position: 'absolute', bottom: '60px', right: '0',
            background: 'rgba(30, 30, 40, 0.95)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.2)', borderRadius: '20px',
            padding: '20px', width: '280px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '15px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <h4 style={{ margin: 0, color: '#fff', fontSize: '0.9rem' }}>CUSTOM COLOR</h4>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '4px' }}>
                    <X size={16} />
                </button>
            </div>

            {/* Preview & Hex */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: hex, border: '1px solid rgba(255,255,255,0.2)', boxShadow: `0 0 15px ${hex}40` }} />
                <input
                    type="text"
                    value={hex}
                    onChange={(e) => { setHex(e.target.value); onChange(e.target.value); }}
                    style={{ flex: 1, background: '#111', border: '1px solid #333', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'monospace', outline: 'none', textTransform: 'uppercase' }}
                />
            </div>

            {/* Sliders */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Hue */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#888', marginBottom: '4px' }}>
                        <span>HUE</span> <span>{hsl.h}°</span>
                    </div>
                    <input
                        type="range" min="0" max="360" value={hsl.h}
                        onChange={(e) => handleHslChange('h', e.target.value)}
                        style={{
                            width: '100%', height: '10px', borderRadius: '5px', appearance: 'none',
                            background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
                            outline: 'none', cursor: 'pointer'
                        }}
                    />
                </div>

                {/* Saturation */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#888', marginBottom: '4px' }}>
                        <span>SATURATION</span> <span>{hsl.s}%</span>
                    </div>
                    <input
                        type="range" min="0" max="100" value={hsl.s}
                        onChange={(e) => handleHslChange('s', e.target.value)}
                        style={{
                            width: '100%', height: '10px', borderRadius: '5px', appearance: 'none',
                            background: `linear-gradient(to right, #808080, ${hslToHex(hsl.h, 100, 50)})`,
                            outline: 'none', cursor: 'pointer'
                        }}
                    />
                </div>

                {/* Lightness */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#888', marginBottom: '4px' }}>
                        <span>LIGHTNESS</span> <span>{hsl.l}%</span>
                    </div>
                    <input
                        type="range" min="0" max="100" value={hsl.l}
                        onChange={(e) => handleHslChange('l', e.target.value)}
                        style={{
                            width: '100%', height: '10px', borderRadius: '5px', appearance: 'none',
                            background: `linear-gradient(to right, #000, ${hslToHex(hsl.h, hsl.s, 50)}, #fff)`,
                            outline: 'none', cursor: 'pointer'
                        }}
                    />
                </div>
            </div>

            <button onClick={onClose} style={{
                marginTop: '5px', padding: '12px', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg, #4ade80, #3b82f6)', color: 'white', fontWeight: 'bold',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}>
                <Check size={16} /> DONE
            </button>

            {/* CSS for custom Range Slider Thumbs */}
            <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 18px; width: 18px;
          border-radius: 50%;
          background: #fff;
          border: 2px solid rgba(0,0,0,0.1);
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          cursor: pointer;
          margin-top: 0px; 
        }
      `}</style>
        </div>
    );
};

export default CustomColorPicker;
