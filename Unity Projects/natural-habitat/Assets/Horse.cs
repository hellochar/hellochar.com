using UnityEngine;
using System.Collections;
using System.Collections.Generic;

public class Horse : MonoBehaviour {
	private Behavior currentBehavior;
	private float currentBehaviorTime;
	private float wantedBehaviorTime;

	private Animator animator;
	private List<Horse> allHorses;

	void Start () {
		allHorses = new List<Horse> ();
		foreach ( GameObject horseGameObject in GameObject.FindGameObjectsWithTag ("horse")) {
			Horse horseScript = horseGameObject.GetComponent<Horse>();
			if (horseScript != null) {
				allHorses.Add (horseScript);
			}
		}
		Vector3 newScale = transform.localScale;
		float scale = Random.Range (0.8f, 1.2f);
		newScale.x *= scale;
		newScale.y *= scale;
		newScale.z *= scale;
		transform.localScale = newScale;
		animator = GetComponent<Animator>();
		doNewBehavior ();
		animator.SetFloat ("Speed", 0);
	}

	public void doNewBehavior() {
		this.currentBehaviorTime = 0;
		this.wantedBehaviorTime = Random.Range (0f, 1f) * Random.Range (0f, 1f) * 12 + 2;
		
		if (HorseKinectState.instance.getAllPeopleCenters ().Count > 0 && Random.Range(0f, 1f) < 0.5f) {
			this.currentBehavior = new LookAtHumanBehavior(this);
			return;
		}

		if (currentBehavior is IdleBehavior) {
			Behavior[] possibleBehaviors = new Behavior[] {
				new FlockBehavior (this),
				new RunToTargetBehavior (this)
			};
			this.currentBehavior = possibleBehaviors [Random.Range (0, possibleBehaviors.Length)];
		} else {
			this.currentBehavior = new IdleBehavior(this);
		}
	}

	public void separate() {
		// separate
		List<Horse> neighbors = getNearbyHorses (5);
		neighbors.Remove (this);
		// follow nearest horse
		Vector3 awayDirection = new Vector3 ();
		foreach( Horse otherHorse in neighbors) {
			awayDirection += (getFlatPosition() - otherHorse.getFlatPosition()).normalized;
		}
		turnTowardsHeading (awayDirection);
	}

	public Vector3 getFlatPosition() {
		return new Vector3(transform.position.x, 0, transform.position.z);
	}

	public Vector3 getFlatDirection() {
		return new Vector3 (transform.forward.x, 0, transform.forward.z).normalized;
	}

	public List<Horse> getNearbyHorses(float distance) {
		return allHorses.FindAll (delegate(Horse horse) {
			return (horse.getFlatPosition () - getFlatPosition ()).magnitude < distance;
		});
	}

	public void turnTowardsPoint(Vector3 point) {
		turnTowardsHeading(point - getFlatPosition ());
	}

	public void turnTowardsHeading(Vector3 heading) {
		Vector3 newDir = Vector3.RotateTowards (getFlatDirection (), heading, 0.0425f, 0f);
		transform.rotation = Quaternion.LookRotation (newDir);
	}

	public void moveForward(float speed) {
		transform.Translate (Vector3.forward * Time.deltaTime * speed);
	}
	
	// Update is called once per frame
	void Update () {
		Vector3 positionOld = transform.position;

		this.currentBehavior.update ();

		correctZAngle ();

		bool horseOutOfFrustum = transform.position.z < -0.5 * transform.position.x;
		if (transform.position.z < 6f || horseOutOfFrustum || areHorsesInTheWay()) {
			transform.position = positionOld;
		}

		Vector3 positionOffset = transform.position - positionOld;
		animator.SetFloat ("Speed", positionOffset.magnitude / Time.deltaTime);
		
		currentBehaviorTime += Time.deltaTime;
		if (currentBehaviorTime > wantedBehaviorTime) {
			this.doNewBehavior();
		}

	}

	bool areHorsesInTheWay() {
		List<Horse> horses = getNearbyHorses (2.5f);
		horses.Remove (this);
		foreach (Horse horse in horses) {
			Vector3 horseLocalPosition = transform.InverseTransformPoint(horse.getFlatPosition());
			float angleTo = Vector3.Angle(horseLocalPosition, Vector3.forward);
			if (angleTo < 15) {
				return true;
			}
		}
		return false;
	}

	void correctZAngle() {
		float backFeetZ = -0.75f;
		float frontFeetZ = 0.875f;
		Vector3 backFeetGlobalPosition = transform.TransformPoint (new Vector3(0, 0, backFeetZ));
		Vector3 frontFeetGlobalPosition = transform.TransformPoint (new Vector3(0, 0, frontFeetZ));
		float feetDistance = (backFeetGlobalPosition - frontFeetGlobalPosition).magnitude;
		backFeetGlobalPosition.y += 10;
		frontFeetGlobalPosition.y += 10;
		RaycastHit rcHitBack, rcHitFront;
		Physics.Raycast (backFeetGlobalPosition, Vector3.down, out rcHitBack, 1 << 8);
		Physics.Raycast (frontFeetGlobalPosition, Vector3.down, out rcHitFront, 1 << 8);

		float h1 = rcHitBack.point.y;
		float h2 = rcHitFront.point.y;

		// sink horse down a bit so while on an angle the feet aren't floating
		float centerY = (h1 + h2) / 2 - 0.1f;
		float newXRotation = Mathf.Asin ((h1 - h2) / feetDistance) * 180 / Mathf.PI;

		Quaternion newLocalRotation = transform.localRotation;
		Vector3 newEulerAngles = newLocalRotation.eulerAngles;
		newEulerAngles.x = newXRotation;
		newLocalRotation.eulerAngles = newEulerAngles;
		transform.localRotation = newLocalRotation;//Quaternion.Slerp(transform.localRotation, newLocalRotation, 0.25f);
			
		Vector3 newPosition = transform.position;
		newPosition.y = centerY;
		transform.position = newPosition;
	}

	public abstract class Behavior {
		public Horse horse;
		public Behavior(Horse horse) {
			this.horse = horse;
		}
		public abstract void update();
	}

	public class IdleBehavior : Behavior {

		public IdleBehavior(Horse horse) : base(horse) {}

		public override void update() {
		}
	}

	public class LookAtHumanBehavior : Behavior {
		private bool walk;
		public LookAtHumanBehavior(Horse horse) : base(horse) {
			if (Random.Range(0f, 1f) < 0.5) {
				walk = true;
			} else {
				walk = false;
			}
		}

		public override void update() {
			List<Vector3> people = HorseKinectState.instance.getAllPeopleCenters ();
			if (people.Count == 0) {
				horse.doNewBehavior();
			} else {
				Vector3 closestHuman = people[0];
				foreach( Vector3 v in people) {
					if ((v - horse.getFlatPosition()).magnitude < (closestHuman - horse.getFlatPosition()).magnitude) {
						closestHuman = v;
					}
				}

				horse.turnTowardsPoint(closestHuman);
				float distance = (closestHuman - horse.getFlatPosition()).magnitude;
				if (distance > 4f && walk) {
					if (distance > 15f) {
						horse.moveForward (3.2f);
					} else {
						horse.moveForward(3.0f);
					}
				}
			}
		}
	}

	public class FlockBehavior : Behavior {
		public FlockBehavior(Horse horse) : base(horse) {}

		public override void update() {
			follow ();
			horse.separate ();
			
			horse.moveForward (3.0f);
		}

		private void follow() {
			List<Horse> neighbors = horse.getNearbyHorses (25);
			neighbors.Remove (horse);
			// follow nearest horse
			if (neighbors [0] != null) {
				Horse nearbyHorse = neighbors [0];
				float distance = (nearbyHorse.getFlatPosition() - horse.getFlatPosition()).magnitude;
				if (distance > 3.5f) {
					horse.turnTowardsPoint (nearbyHorse.getFlatPosition ());
				}
			}
		}
	}

	public class RunToTargetBehavior : Behavior {
		private Vector3 targetFlatLocation = new Vector3 (Random.Range(-28f, 13f), 0, Random.Range(8f, 45f));
		private float speed;

		public RunToTargetBehavior(Horse horse) : base(horse) {
			if (Random.value < 0.5) {
				speed = Random.Range(2.3f, 3.8f);
			} else {
				speed = Random.Range(6f, 7.5f);
			}
		}

		public override void update() {
			Vector3 targetDir = targetFlatLocation - horse.getFlatPosition();
			if (targetDir.magnitude < 1f) {
				horse.doNewBehavior();
			} else {
				horse.turnTowardsPoint(targetFlatLocation);
				horse.separate();
				horse.moveForward(speed);
			}
		}
	}
}
