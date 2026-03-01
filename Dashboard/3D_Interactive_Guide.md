# Interactive 3D Visualizations for Portfolio Websites

This guide explains how to create mouse-interactive 3D models like the one in the Digital Circuits infographic.

---

## What Library Was Used?

The 3D surface plot uses **[Plotly.js](https://plotly.com/javascript/)** - a powerful, free charting library that supports interactive 3D graphics out of the box.

### Why Plotly?
| Feature | Plotly.js | Three.js | WebGL Direct |
|---------|-----------|----------|--------------|
| Ease of Use | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐ |
| Interactivity | Built-in | Manual | Manual |
| 3D Charts | Yes | No (3D scenes) | No |
| File Size | Medium | Large | Tiny |
| Best For | Data viz | Games/Complex 3D | Custom effects |

---

## Quick Start Code

### 1. Include Plotly.js
```html
<script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
```

### 2. Create a Container
```html
<div id="my3DPlot" style="width: 100%; height: 400px;"></div>
```

### 3. Generate the 3D Surface
```javascript
// Create data grid
const size = 20;
let x = [], y = [], z = [];

for (let i = 0; i < size; i++) {
    x.push(i);
    y.push(i);
    let row = [];
    for (let j = 0; j < size; j++) {
        // Mathematical function creates the wave pattern
        row.push(Math.sin(i / 3) * Math.cos(j / 3));
    }
    z.push(row);
}

// Render the plot
Plotly.newPlot('my3DPlot', [{
    z: z,
    type: 'surface',
    colorscale: [
        [0, '#4361EE'],   // Color at lowest point
        [1, '#F72585']    // Color at highest point
    ],
    showscale: false      // Hide the color legend
}], {
    margin: { l: 0, r: 0, b: 0, t: 0 },
    paper_bgcolor: 'rgba(0,0,0,0)',  // Transparent background
    plot_bgcolor: 'rgba(0,0,0,0)'
}, {
    displayModeBar: false  // Hide toolbar
});
```

---

## Interactive Features (Automatic)

Once you use Plotly.js, these work automatically:
- 🖱️ **Click + Drag** → Rotate the 3D model
- 🔍 **Scroll** → Zoom in/out
- 📍 **Hover** → Show data point values

---

## Portfolio Ideas

### 1. Skills Visualization
```javascript
// 3D bar chart of your skills
const skills = {
    x: ['JS', 'Python', 'React', 'Node', 'SQL'],
    y: ['Frontend', 'Backend', 'Data'],
    z: [
        [90, 70, 85, 60, 50],  // Frontend scores
        [80, 90, 40, 95, 80],  // Backend scores
        [60, 95, 30, 50, 90]   // Data scores
    ]
};
```

### 2. Project Complexity Map
```javascript
// Surface showing project difficulty over time
// X = Time spent, Y = Technologies used, Z = Complexity
```

### 3. Animated Data Sphere
```javascript
// Parametric sphere with color gradients
const theta = [], phi = [], r = [];
for (let i = 0; i < 100; i++) {
    for (let j = 0; j < 100; j++) {
        theta.push(i * 2 * Math.PI / 100);
        phi.push(j * Math.PI / 100);
        r.push(1 + 0.3 * Math.sin(5 * theta[theta.length-1]));
    }
}
```

---

## Alternative Libraries

| Library | Best For | Link |
|---------|----------|------|
| **Three.js** | Full 3D scenes, games, complex models | [threejs.org](https://threejs.org) |
| **Spline** | No-code 3D design (embed in websites) | [spline.design](https://spline.design) |
| **Model Viewer** | Display .glb/.gltf 3D models | [modelviewer.dev](https://modelviewer.dev) |
| **A-Frame** | VR/AR experiences | [aframe.io](https://aframe.io) |

---

## Full Example for Portfolio

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
    <style>
        .hero-3d {
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            padding: 2rem;
            border-radius: 1rem;
        }
    </style>
</head>
<body>
    <div class="hero-3d">
        <h2 style="color: #4CC9F0;">My Skills Universe</h2>
        <div id="skillsPlot" style="height: 400px;"></div>
    </div>

    <script>
        // Create wave pattern
        const size = 25;
        let z = [];
        for (let i = 0; i < size; i++) {
            let row = [];
            for (let j = 0; j < size; j++) {
                row.push(Math.sin(i/4) * Math.cos(j/4) * Math.exp(-0.01*(i*i + j*j)));
            }
            z.push(row);
        }

        Plotly.newPlot('skillsPlot', [{
            z: z,
            type: 'surface',
            colorscale: [[0, '#667eea'], [0.5, '#764ba2'], [1, '#f72585']],
            showscale: false,
            contours: {
                z: { show: true, usecolormap: true, highlightcolor: "#42f5f5", project: { z: true } }
            }
        }], {
            margin: { l: 0, r: 0, b: 0, t: 0 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            scene: {
                xaxis: { showgrid: false, zeroline: false, showticklabels: false },
                yaxis: { showgrid: false, zeroline: false, showticklabels: false },
                zaxis: { showgrid: false, zeroline: false, showticklabels: false }
            }
        }, { displayModeBar: false });
    </script>
</body>
</html>
```

---

## Tips for Portfolio Use

1. **Keep it subtle** - Don't make the 3D too flashy; it should enhance, not distract
2. **Match your theme** - Use colors from your portfolio's palette in the `colorscale`
3. **Performance** - Keep `size` under 30 for smooth mobile performance
4. **Accessibility** - Add a text description for screen readers

---

*Created for portfolio enhancement. Feel free to modify and use!*
