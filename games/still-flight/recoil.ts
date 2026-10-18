import { Vector3 } from '@babylonjs/core';

// carrierMass is the remaining suit/attached mass, excluding the ejected round.
// Both velocities are in world space. launchSpeed is rocket speed relative to
// the carrier immediately after separation, before the rocket motor accelerates it.
export function launchMomentum(velocity:Vector3,direction:Vector3,carrierMass:number,rocketMass=.8,launchSpeed=12){
  if(carrierMass<=0||rocketMass<=0||direction.lengthSquared()<1e-12)throw new Error('Invalid launch mass or direction');
  const axis=direction.normalizeToNew(),recoil=axis.scale(rocketMass*launchSpeed/(carrierMass+rocketMass));
  const carrierVelocity=velocity.subtract(recoil);
  const rocketVelocity=carrierVelocity.add(axis.scale(launchSpeed));
  return {carrierVelocity,rocketVelocity};
}
