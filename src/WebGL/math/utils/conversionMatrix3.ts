import { Matrix3 } from "../math";
export function conversionMatrix3(
  a: number,
  b: number,
  c: number,
  alpha: number,
  beta: number,
  gamma: number
) {
  alpha = (alpha * Math.PI) / 180;
  beta = (beta * Math.PI) / 180;
  gamma = (gamma * Math.PI) / 180;
  const sqr = (x: number) => {
    return x*x
  };
  const cosAlpha = Math.cos(alpha);
  const cosBeta = Math.cos(beta);
  const cosGamma = Math.cos(gamma);
  const sinGamma = Math.sin(gamma);
  const conversionMatrix = new Matrix3(
    a,
    b * cosGamma,
    c * cosBeta,
    0,
    b * sinGamma,
    (c * (cosAlpha - cosBeta * cosGamma)) / sinGamma,
    0,
    0,
    (c *
      Math.sqrt(
        1 -
          sqr(cosAlpha) -
          sqr(cosBeta) -
          sqr(cosGamma) +
          2 * cosAlpha * cosBeta * cosGamma
      )) /
      sinGamma
  );
  return conversionMatrix;
}
