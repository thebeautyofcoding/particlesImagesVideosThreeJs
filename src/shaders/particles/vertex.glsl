uniform vec2 uResolution;
uniform float uSize;
uniform float uProgress;
attribute float aAngle;
varying vec2 vUv;
uniform vec3 uMouse;
uniform float uTime;
void main()
{
    vec3 pos = position;
    float angle = uTime;
    pos.x += sin(pos.y + angle) * 0.1;
    pos.y += cos(pos.x + angle) * 0.1;
    vec3 distanceToMouseVector = pos - uMouse;
    float distanceToMouse = length(distanceToMouseVector);
    float strength = 1.0 / pow(distanceToMouse, 2.);
    vec3 displacement = vec3(
            cos(aAngle) * strength,
            sin(aAngle) * strength,
            1.
        );
    pos.xyz += normalize(displacement) * strength;
    pos.z += sin(uProgress * aAngle) * 10.;
    vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;
    // Point size
    gl_PointSize = uSize * uResolution.y;
    gl_PointSize *= (1.0 / -viewPosition.z);
    vUv = uv;
}
