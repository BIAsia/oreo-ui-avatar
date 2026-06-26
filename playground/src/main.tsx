import * as React from "react";
import { createRoot } from "react-dom/client";
import { Avatar } from "../../src/react";
import { getPaletteMainHue, palettes, shapes } from "../../src";
import type { ShapeId } from "../../src";
import "./styles.css";

function App() {
  const [shape, setShape] = React.useState<ShapeId>("bloom");
  const [palette, setPalette] = React.useState("rose-milk");
  const selectedPalette = palettes.find((item) => item.id === palette) ?? palettes[0];
  const [hue, setHue] = React.useState(getPaletteMainHue(selectedPalette));
  const [chroma, setChroma] = React.useState(1);
  const [lightness, setLightness] = React.useState(0);

  React.useEffect(() => {
    setHue(getPaletteMainHue(selectedPalette));
    setChroma(1);
    setLightness(0);
  }, [selectedPalette]);

  return (
    <main>
      <aside>
        <h1>Oreo Avatar</h1>
        <div className="generated">
          <Avatar shape={shape} palette={palette} tone={{ hue, chroma, lightness }} size={64} />
          <div>
            <strong>{shapes.find((item) => item.id === shape)?.name}</strong>
            <span>{selectedPalette.name}</span>
          </div>
        </div>

        <label>
          Shape
          <select value={shape} onChange={(event) => setShape(event.target.value as ShapeId)}>
            {shapes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <section>
          <div className="section-title">Palette preset</div>
          <div className="palette-list">
            {palettes.map((item) => (
              <button key={item.id} className={item.id === palette ? "active" : ""} onClick={() => setPalette(item.id)}>
                <span className="strip">
                  {Object.values(item.colors).slice(0, 5).map((color) => (
                    <i key={color} style={{ background: color }} />
                  ))}
                </span>
                <small>{item.name}</small>
              </button>
            ))}
          </div>
        </section>

        <label>
          Hue {Math.round(hue)} deg
          <input type="range" min={0} max={360} value={hue} onChange={(event) => setHue(Number(event.target.value))} />
        </label>
        <label>
          Chroma {Math.round(chroma * 100)}%
          <input type="range" min={0.45} max={1.55} step={0.01} value={chroma} onChange={(event) => setChroma(Number(event.target.value))} />
        </label>
        <label>
          Lightness {lightness.toFixed(2)}
          <input type="range" min={-0.18} max={0.18} step={0.01} value={lightness} onChange={(event) => setLightness(Number(event.target.value))} />
        </label>
      </aside>

      <section className="grid">
        {palettes.flatMap((item) =>
          shapes.map((shapeItem) => (
            <button
              key={`${shapeItem.id}-${item.id}`}
              onClick={() => {
                setShape(shapeItem.id);
                setPalette(item.id);
              }}
            >
              <Avatar shape={shapeItem.id} palette={item.id} size={64} />
              <span>{shapeItem.name}</span>
              <small>{item.name}</small>
            </button>
          )),
        )}
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
