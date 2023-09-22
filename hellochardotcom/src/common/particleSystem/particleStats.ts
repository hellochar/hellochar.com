import { IParticle, ParticleSystem } from "./particleSystem";

export function computeStats(particleSystem: ParticleSystem) {
    const { particles } = particleSystem;
    const NUM_PARTICLES = particles.length;
    let averageX = 0, averageY = 0, averageVel2 = 0;
    let varianceX2 = 0;
    let varianceY2 = 0;
    // let varianceVel22 = 0;
    let entropy = 0;

    for (let i = 0; i < NUM_PARTICLES; i++) {
        const particle = particles[i];
        averageX += particle.x;
        averageY += particle.y;
        averageVel2 += particle.dx * particle.dx + particle.dy * particle.dy;
    }
    averageX /= NUM_PARTICLES;
    averageY /= NUM_PARTICLES;
    averageVel2 /= NUM_PARTICLES;

    for (let i = 0; i < NUM_PARTICLES; i++) {
        const particle = particles[i];
        const dx2 = Math.pow(particle.x - averageX, 2),
            dy2 = Math.pow(particle.y - averageY, 2);
        varianceX2 += dx2;
        varianceY2 += dy2;
        // varianceVel22 += Math.pow(particle.dx * particle.dx + particle.dy * particle.dy - averageVel2, 2);
        const length = Math.sqrt(dx2 + dy2);
        if (length > 0) {
            entropy += length * Math.log(length);
        }
    }
    entropy /= NUM_PARTICLES;
    varianceX2 /= NUM_PARTICLES;
    varianceY2 /= NUM_PARTICLES;
    // varianceVel22 /= NUM_PARTICLES;

    const varianceX = Math.sqrt(varianceX2);
    const varianceY = Math.sqrt(varianceY2);
    // const varianceVel2 = Math.sqrt(varianceVel22);

    const varianceLength = Math.sqrt(varianceX2 + varianceY2);
    // const varianceVel = Math.sqrt(varianceVel2);
    const averageVel = Math.sqrt(averageVel2);

    // flatRatio = 1 -> perfectly circular
    // flatRatio is high (possibly Infinity) -> extremely horizontally flat
    // flatRatio is low (near 0) -> vertically thin
    let flatRatio = varianceX / varianceY;
    if (varianceY === 0) { flatRatio = 1; }

    // in reset formation, the varianceLength = (sqrt(1/2) - 1/2) * magicNumber * canvasWidth
    // magicNumber is experimentally found to be 1.3938
    // AKA varianceLength = 0.28866 * canvasWidth
    const normalizedVarianceLength = varianceLength / (0.28866 * particleSystem.canvas.width);
    const normalizedAverageVel = averageVel / (particleSystem.canvas.width);
    const normalizedEntropy = entropy / (particleSystem.canvas.width * 1.383870349);

    const groupedUpness = Math.sqrt(averageVel / varianceLength);

    return {
        averageX,
        averageY,
        averageVel,
        varianceLength,
        flatRatio,
        groupedUpness,
        normalizedEntropy,
        normalizedVarianceLength,
        normalizedAverageVel,
    };
}
