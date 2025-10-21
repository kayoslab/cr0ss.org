export interface Point {
  x: number;
  y: number;
}

export function polygons(element: string, svgDocument: Document): SVGPoint[] {
  const NUM_POINTS = 20;
  const world = svgDocument.getElementById("world") as SVGSVGElement | null
  const path = world?.getElementById(element) as unknown as SVGPolygonElement;
  const len = path?.getTotalLength();
  const points: SVGPoint[] = [];

  if (world) {
    for (let i=0; i < NUM_POINTS; i++) {
        const point = world.createSVGPoint();
        const pt = path.getPointAtLength(i * len / (NUM_POINTS-1));
        point.x = pt.x;
        point.y = pt.y;
        points.push(point);
    }
  }

  return points;
}

export function area(pts: SVGPoint[]): number {
  let area = 0;
  const nPts = pts.length;
  let j = nPts - 1;
  let p1: Point;
  let p2: Point;

  for (let i = 0; i < nPts; j = i++) {
    p1 = pts[i];
    p2 = pts[j];
    area += p1.x * p2.y;
    area -= p1.y * p2.x;
  }
  area /= 2;
  return area;
};

export function computeCentroid(pts: SVGPoint[]) {
    const nPts = pts.length;
    let x=0; let y=0;
    let f;
    let j=nPts-1;
    let p1; let p2;

    for (let i=0;i<nPts;j=i++) {
        p1=pts[i]; p2=pts[j];
        f=p1.x*p2.y-p2.x*p1.y;
        x+=(p1.x+p2.x)*f;
        y+=(p1.y+p2.y)*f;
    }

    f=area(pts)*6;
    return [x/f,y/f];
};