uniform sampler2D uTexture;
varying vec2 vUv;
void main()
{
    vec2 uv = gl_PointCoord.xy;
    vec4 color = texture2D(uTexture, vUv);
    // calcuates the distance from the center of the point to the current pixel
    float distanceToCenter = distance(uv, vec2(0.5, 0.5));
    if (distanceToCenter > 0.5) discard;
    gl_FragColor = color;
}
