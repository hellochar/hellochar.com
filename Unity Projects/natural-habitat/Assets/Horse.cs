using UnityEngine;
using System.Collections;
using System.Collections.Generic;

public class Horse : MonoBehaviour {
	public Behavior currentBehavior;
	private Animator animator;
	private List<Horse> allHorses;

	void Start () {
		allHorses = new List<Horse> ();
		foreach ( GameObject horseGameObject in GameObject.FindGameObjectsWithTag ("horse")) {
			Horse horseScript = horseGameObject.GetComponent<Horse>();
			allHorses.Add (horseScript);
		}
		animator = GetComponent<Animator>();
//		currentBehavior = new IdleBehavior (this);
		currentBehavior = new RunToTargetBehavior (this);
		animator.SetFloat ("Speed", 0);
	}

	public Vector3 getFlatPosition() {
		return new Vector3(transform.position.x, 0, transform.position.z);
	}

	public Vector3 getFlatDirection() {
		return new Vector3 (transform.forward.x, 0, transform.forward.z).normalized;
	}

	public List<Horse> getNearbyHorses() {
		float HORSE_NEARBY_DISTANCE = 25;
		return allHorses.FindAll (delegate(Horse horse) {
			return (horse.getFlatPosition () - getFlatPosition ()).magnitude < HORSE_NEARBY_DISTANCE && horse;
		});
	}

	public void turnTowards(Vector3 point) {
		Vector3 newDir = Vector3.RotateTowards (getFlatDirection (), point - getFlatDirection(), 0.25f, 0f);
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

		Vector3 positionOffset = transform.position - positionOld;
		animator.SetFloat ("Speed", positionOffset.magnitude);
		List<Horse> horses = getNearbyHorses ();
		Vector3 nearbyFlatCenter = new Vector3 ();
		foreach (Horse h in horses) {
			nearbyFlatCenter += h.getFlatPosition();
		}
		nearbyFlatCenter /= horses.Count;
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
		private float idledTime = 0f;
		private float wantedIdleTime = Random.Range(0f, 1f) * Random.Range (0f, 1f) * 12 + 2;

		public IdleBehavior(Horse horse) : base(horse) {}

		public override void update() {
			idledTime += Time.deltaTime;
			if (idledTime > wantedIdleTime) {
				horse.currentBehavior = new RunToTargetBehavior(horse);
			}
		}
	}

	public class FlockBehavior : Behavior {
		public FlockBehavior(Horse horse) : base(horse) {}

		public override void update() {
			List<Horse> neighbors = horse.getNearbyHorses ();
			neighbors.Remove (horse);
		}
	}

	public class RunToTargetBehavior : Behavior {
//		public Vector3 targetFlatLocation = new Vector3 (Random.Range(-28f, 14f), 0, Random.Range(8f, 45f));
		public Vector3 targetFlatLocation = new Vector3 (0, 0, 15f);
		public float speed = Random.Range(2.3f, 3.8f);

		public RunToTargetBehavior(Horse horse) : base(horse) {}

		public override void update() {
			Vector3 targetDir = targetFlatLocation - horse.getFlatPosition();
			Debug.Log (targetDir.magnitude);
			if (targetDir.magnitude < 1f) {
				horse.currentBehavior = new IdleBehavior(horse);
			} else {
				horse.turnTowards(targetFlatLocation);
//				horse.moveForward(speed);
			}
		}
	}
}
