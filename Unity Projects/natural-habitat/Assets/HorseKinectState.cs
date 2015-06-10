using UnityEngine;
using System.Collections;
using System.Collections.Generic;

using System;
using System.Runtime.InteropServices;
using System.Runtime.CompilerServices;
using System.IO;
using System.Text; 

public class HorseKinectState : MonoBehaviour {
	public static HorseKinectState instance;
	KinectWrapper.NuiTransformSmoothParameters smoothParameters;
	private KinectWrapper.NuiSkeletonFrame skeletonFrame;

	void Awake() {
		int hr = 0;
		
		try
		{
			hr = KinectWrapper.NuiInitialize(KinectWrapper.NuiInitializeFlags.UsesSkeleton | KinectWrapper.NuiInitializeFlags.UsesDepthAndPlayerIndex);
			if (hr != 0) {
				throw new Exception("NuiInitialize Failed");
			}
			
			hr = KinectWrapper.NuiSkeletonTrackingEnable(IntPtr.Zero, 8);  // 0, 12,8
			if (hr != 0) {
				throw new Exception("Cannot initialize Skeleton Data");
			}

			// set kinect elevation angle
			KinectWrapper.NuiCameraElevationSetAngle(0);
			
			// init skeleton structures
			skeletonFrame = new KinectWrapper.NuiSkeletonFrame() { 
				SkeletonData = new KinectWrapper.NuiSkeletonData[KinectWrapper.Constants.NuiSkeletonCount]
			};
			
			// values used to pass to smoothing function
			smoothParameters = new KinectWrapper.NuiTransformSmoothParameters();
			
			smoothParameters.fSmoothing = 0.5f;
			smoothParameters.fCorrection = 0.5f;
			smoothParameters.fPrediction = 0.5f;
			smoothParameters.fJitterRadius = 0.05f;
			smoothParameters.fMaxDeviationRadius = 0.04f;

			instance = this;
			DontDestroyOnLoad(gameObject);
		}
		catch(DllNotFoundException e)
		{
			string message = "Please check the Kinect SDK installation.";
			Debug.LogError(message);
			Debug.LogError(e.ToString());
			return;
		}
		catch (Exception e)
		{
			string message = e.Message + " - " + KinectWrapper.GetNuiErrorString(hr);
			Debug.LogError(message);
			Debug.LogError(e.ToString());
			return;
		}
	}

	private List<Vector3> peopleCenters = new List<Vector3>();
	// Update is called once per frame
	void Update () {
		if (KinectWrapper.PollSkeleton (ref smoothParameters, ref skeletonFrame)) {
			peopleCenters = new List<Vector3> ();
			for (int i = 0; i < KinectWrapper.Constants.NuiSkeletonCount; i++) {
				KinectWrapper.NuiSkeletonData skeletonData = skeletonFrame.SkeletonData[i];
				if (skeletonData.eTrackingState != KinectWrapper.NuiSkeletonTrackingState.NotTracked) {
					Vector3 position = new Vector3(skeletonData.Position.x * 2.25f, 0f, -skeletonData.Position.z);
					peopleCenters.Add (position);
				}
			}
		}
	}

	// centerpoint of all people detected by kinect, normalized into horse locations
	public List<Vector3> getAllPeopleCenters() {
//		Debug.Log (peopleCenters);
		return new List<Vector3>(peopleCenters);
	}
}
