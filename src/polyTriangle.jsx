import { useRef } from "react";
import chroma from "chroma-js";
import Delaunator from "delaunator";
import seedrandom from "seedrandom";
import { range } from "lodash-es";

const palette = [
  "#000080",
  "#00008b",
  "#0000cd",
  "#006400",
  "#008000",
  "#008080",
  "#008b8b",
  "#00bfff",
  "#00ced1",
  "#00f",
  "#00fa9a",
  "#00ff7f",
  "#0f0",
  "#0ff",
  "#0ff",
  "#191970",
  "#1e90ff",
  "#20b2aa",
  "#228b22",
  "#2e8b57",
  "#2f4f4f",
  "#32cd32",
  "#3cb371",
  "#40e0d0",
  "#4169e1",
  "#4682b4",
  "#483d8b",
  "#48d1cc",
  "#4b0082",
  "#556b2f",
  "#5f9ea0",
  "#639",
  "#6495ed",
  "#66cdaa",
  "#6a5acd",
  "#6b8e23",
  "#7b68ee",
  "#7cfc00",
  "#7fff00",
  "#7fffd4",
  "#800000",
  "#800080",
  "#808000",
  "#87ceeb",
  "#87cefa",
  "#8a2be2",
  "#8b0000",
  "#8b008b",
  "#8b4513",
  "#8fbc8f",
  "#90ee90",
  "#9370d8",
  "#9400d3",
  "#98fb98",
  "#9932cc",
  "#9acd32",
  "#a0522d",
  "#a52a2a",
  "#add8e6",
  "#adff2f",
  "#afeeee",
  "#b0c4de",
  "#b0e0e6",
  "#b22222",
  "#b8860b",
  "#ba55d3",
  "#bc8f8f",
  "#bdb76b",
  "#c71585",
  "#cd5c5c",
  "#cd853f",
  "#d2691e",
  "#d2b48c",
  "#d87093",
  "#d8bfd8",
  "#da70d6",
  "#daa520",
  "#dc143c",
  "#dda0dd",
  "#deb887",
  "#e0ffff",
  "#e6e6fa",
  "#e9967a",
  "#ee82ee",
  "#eee8aa",
  "#f00",
  "#f08080",
  "#f0e68c",
  "#f0f",
  "#f0f",
  "#f4a460",
  "#f5deb3",
  "#f5f5dc",
  "#fa8072",
  "#fafad2",
  "#ff0",
  "#ff1493",
  "#ff4500",
  "#ff6347",
  "#ff69b4",
  "#ff7f50",
  "#ff8c00",
  "#ffa07a",
  "#ffa500",
  "#ffb6c1",
  "#ffc0cb",
  "#ffd700",
  "#ffdab9",
  "#ffdead",
  "#ffe4b5",
  "#ffe4c4",
  "#ffe4e1",
];

const generateGrid = (
  width,
  height,
  bleedX,
  bleedY,
  cellSize,
  variance,
  rand
) => {
  const w = width + bleedX;
  const h = height + bleedY;
  const halfCellSize = cellSize * 0.5;
  const doubleV = variance * 2;
  const negativeV = -variance;

  const points = [];
  for (let i = -bleedX; i < w; i += cellSize) {
    for (let j = -bleedY; j < h; j += cellSize) {
      const x = i + halfCellSize + (rand() * doubleV + negativeV);
      const y = j + halfCellSize + (rand() * doubleV + negativeV);
      points.push([Math.floor(x), Math.floor(y)]);
    }
  }

  return points;
};

const autoGradient = (color, numColors) => {
  const lab = chroma(color).lab();
  const lRange = 100 * (0.95 - 1 / numColors);
  const lStep = lRange / (numColors - 1);
  const lStart = (100 - lRange) * 0.5;
  const ranged = range(lStart, lStart + numColors * lStep, lStep);

  return ranged.map((l) => chroma.lab([l + 0, lab[1], lab[2]]).hex());
};

const r = palette.map((pallet) => autoGradient(pallet, 2));

const randomFromPalette = (rand) => r[Math.floor(rand() * r.length)];

const _map = (num, inRange) => (num - inRange[0]) / (inRange[1] - inRange[0]);

const _clamp = (num) => Math.min(Math.max(num, 0), 1);

// https://www.mathopenref.com/coordcentroid.html
const _centroid = (d) => ({
  x: (d[0][0] + d[1][0] + d[2][0]) / 3,
  y: (d[0][1] + d[1][1] + d[2][1]) / 3,
});

const gradient = (x, y, color) =>
  chroma.interpolate(color(x), color(x), 0.5, "lab");

const PolyTriangle = (props) => {
  const {
    className,
    width = 600,
    height = 300,
    cellSize = 100,
    variance = 1,
    strokeWidth = 1.5,
    colorSeed,
    shapeSeed,
  } = props;
  const colorRand = seedrandom(colorSeed);
  const shapeRand = seedrandom(shapeSeed);

  const ref = useRef();

  const colors = randomFromPalette(colorRand);
  const colorScale = chroma.scale(colors).mode("lab");

  const cellsX = Math.floor((width + 4 * cellSize) / cellSize);
  const cellsY = Math.floor((height + 4 * cellSize) / cellSize);

  const bleedX = (cellsX * cellSize - width) / 2;
  const bleedY = (cellsY * cellSize - height) / 2;

  const variancePoint = (cellSize * variance) / 2;

  const normX = (x) => _clamp(_map(x, [0, width]));
  const normY = (y) => _clamp(_map(y, [0, height]));

  const points = generateGrid(
    width,
    height,
    bleedX,
    bleedY,
    cellSize,
    variancePoint,
    shapeRand
  );

  const triangles = new Delaunator(points.flat()).triangles;

  const coordinates = [];
  for (let i = 0; i < triangles.length; i += 3) {
    const vertices = [triangles[i], triangles[i + 1], triangles[i + 2]].map(
      (i) => points[i]
    );

    const centroid = _centroid(vertices);
    const color = gradient(
      normX(centroid.x),
      normY(centroid.y),
      colorScale
    ).css();

    coordinates.push([color, vertices]);
  }

  return (
    <svg
      className={className}
      height={height}
      ref={ref}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      xmlns="http://www.w3.org/2000/svg"
    >
      {coordinates.map((poly, index) => (
        <path
          d={`M${poly[1].join("L")}Z`}
          fill={poly[0]}
          key={index}
          stroke={poly[0]}
          strokeWidth={strokeWidth}
        />
      ))}
    </svg>
  );
};

export default PolyTriangle;
