// Choose the column count that maximizes each 16:9 tile within the measured wall.
export function calculateCameraLayout(count: number, size: { width: number; height: number }) {
  let best = { columns: 1, width: 0 };
  for (let columns = 1; columns <= count; columns++) {
    const rows = Math.ceil(count / columns);
    const width = Math.max(
      0,
      Math.min(
        (size.width - (columns - 1) * 8) / columns,
        (((size.height - (rows - 1) * 8) / rows) * 16) / 9,
      ),
    );
    if (width > best.width) best = { columns, width };
  }
  return best;
}
