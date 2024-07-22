export interface Point {
  x: number;
  y: number;
}

export function polygons(element: string, svgDocument: Document): SVGPoint[] {
  const NUM_POINTS = 20;
  const world = svgDocument.getElementById("world") as SVGSVGElement | null
  const path = world?.getElementById(element) as unknown as SVGPolygonElement;
  var len = path?.getTotalLength();
  var points: SVGPoint[] = [];

  console.log(path);

  if (world) {
    for (var i=0; i < NUM_POINTS; i++) {
        var point = world.createSVGPoint();
        var pt = path.getPointAtLength(i * len / (NUM_POINTS-1));
        point.x = pt.x;
        point.y = pt.y;
        points.push(point);
    }
  }
  
  console.log(points);
  return points;
}

export function area(pts: SVGPoint[]): number {
  var area = 0;
  var nPts = pts.length;
  var j = nPts - 1;
  var p1: Point;
  var p2: Point;

  for (var i = 0; i < nPts; j = i++) {
    p1 = pts[i];
    p2 = pts[j];
    area += p1.x * p2.y;
    area -= p1.y * p2.x;
  }
  area /= 2;
  return area;
};

export function computeCentroid(pts: SVGPoint[]) {
    var nPts = pts.length;
    var x=0; var y=0;
    var f;
    var j=nPts-1;
    var p1; var p2;

    for (var i=0;i<nPts;j=i++) {
        p1=pts[i]; p2=pts[j];
        f=p1.x*p2.y-p2.x*p1.y;
        x+=(p1.x+p2.x)*f;
        y+=(p1.y+p2.y)*f;
    }

    f=area(pts)*6;
    return [x/f,y/f];
};