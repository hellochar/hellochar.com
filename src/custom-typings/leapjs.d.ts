// most of this is taken from https://github.com/logotype/LeapMotionTS/blob/master/build/leapmotionts-2.2.4.d.ts
declare module 'leapjs' {
    export function loop(cb: (frame: Frame) => void): Controller;
    /**
     * The EventDispatcher class provides strongly typed events.
     */
    export class EventDispatcher {
        private listeners;
        constructor();
        hasEventListener(type: string, listener: Function): boolean;
        addEventListener(typeStr: string, listenerFunction: Function): void;
        removeEventListener(typeStr: string, listenerFunction: Function): void;
        dispatchEvent(event: LeapEvent): void;
    }
    /**
     * The Listener interface defines a set of callback functions that you can
     * implement to respond to events dispatched by the Leap.
     *
     * <p>To handle Leap events, implement the Listener interface and assign
     * it to the Controller instance. The Controller calls the relevant Listener
     * callback when an event occurs, passing in a reference to itself.
     * You have to implement callbacks for every method specified in the interface.</p>
     *
     * <p>Note: you have to create an instance of the LeapMotion class and set the Listener to your class:</p>
     *
     * <listing>
     * leap = new LeapMotion();
     * leap.controller.setListener( this );</listing>
     *
     * @author logotype
     *
     */
    export interface Listener {
        /**
         * Called when the Controller object connects to the Leap software,
         * or when this Listener object is added to a Controller that is already connected.
         *
         * @param controller The Controller object invoking this callback function.
         *
         */
        onConnect(controller: Controller): void;
        /**
         * Called when the Controller object disconnects from the Leap software.
         *
         * <p>The controller can disconnect when the Leap device is unplugged,
         * the user shuts the Leap software down, or the Leap software encounters
         * an unrecoverable error.</p>
         *
         * <listing>
         * public onDisconnect( controller:Controller ):void {
         *     trace( "Disconnected" );
         * }</listing>
         *
         * <p>Note: When you launch a Leap-enabled application in a debugger,
         * the Leap library does not disconnect from the application.
         * This is to allow you to step through code without losing the connection
         * because of time outs.</p>
         *
         * @param controller The Controller object invoking this callback function.
         *
         */
        onDisconnect(controller: Controller): void;
        /**
         * Called when this Listener object is removed from the Controller or
         * the Controller instance is destroyed.
         *
         * <listing>
         * public onExit( controller:Controller ):void {
         *     trace( "Exited" );
         * }</listing>
         *
         * @param controller The Controller object invoking this callback function.
         *
         */
        onExit(controller: Controller): void;
        /**
         * Called when a new frame of hand and finger tracking data is available.
         *
         * <p>Access the new frame data using the <code>controller.frame()</code> function.</p>
         *
         * <listing>
         * public onFrame( controller:Controller, frame:Frame ):void {
         *     trace( "New frame" );
         * }</listing>
         *
         * <p>Note, the Controller skips any pending onFrame events while your
         * onFrame handler executes. If your implementation takes too long to
         * return, one or more frames can be skipped. The Controller still inserts
         * the skipped frames into the frame history. You can access recent frames
         * by setting the history parameter when calling the <code>controller.frame()</code>
         * function. You can determine if any pending onFrame events were skipped
         * by comparing the ID of the most recent frame with the ID of the last
         * received frame.</p>
         *
         * @param controller The Controller object invoking this callback function.
         * @param frame The most recent frame object.
         *
         */
        onFrame(controller: Controller, frame: Frame): void;
        /**
         * Called once, when this Listener object is newly added to a Controller.
         *
         * <listing>
         * public onInit( controller:Controller ):void {
         *     trace( "Init" );
         * }</listing>
         *
         * @param controller The Controller object invoking this callback function.
         *
         */
        onInit(controller: Controller): void;
    }
    export class DefaultListener extends EventDispatcher implements Listener {
        constructor();
        onConnect(controller: Controller): void;
        onDisconnect(controller: Controller): void;
        onExit(controller: Controller): void;
        onFrame(controller: Controller, frame: Frame): void;
        onInit(controller: Controller): void;
    }
    export class LeapEvent {
        static LEAPMOTION_INIT: string;
        static LEAPMOTION_CONNECTED: string;
        static LEAPMOTION_DISCONNECTED: string;
        static LEAPMOTION_EXIT: string;
        static LEAPMOTION_FRAME: string;
        private _type;
        private _target;
        frame: Frame;
        constructor(type: string, targetListener: Listener, frame?: Frame);
        getTarget(): any;
        getType(): string;
    }
    /**
     * LeapUtil is a collection of static utility functions.
     *
     */
    export class LeapUtil {
        /** The constant pi as a single precision floating point number. */
        static PI: number;
        /**
         * The constant ratio to convert an angle measure from degrees to radians.
         * Multiply a value in degrees by this constant to convert to radians.
         */
        static DEG_TO_RAD: number;
        /**
         * The constant ratio to convert an angle measure from radians to degrees.
         * Multiply a value in radians by this constant to convert to degrees.
         */
        static RAD_TO_DEG: number;
        /**
         * Pi &#42; 2.
         */
        static TWO_PI: number;
        /**
         * Pi &#42; 0.5.
         */
        static HALF_PI: number;
        /**
         * Represents the smallest positive single value greater than zero.
         */
        static EPSILON: number;
        constructor();
        /**
         * Convert an angle measure from radians to degrees.
         *
         * @param radians
         * @return The value, in degrees.
         *
         */
        static toDegrees(radians: number): number;
        /**
         * Determines if a value is equal to or less than 0.00001.
         *
         * @return True, if equal to or less than 0.00001; false otherwise.
         */
        static isNearZero(value: number): boolean;
        /**
         * Determines if all Vector3 components is equal to or less than 0.00001.
         *
         * @return True, if equal to or less than 0.00001; false otherwise.
         */
        static vectorIsNearZero(inVector: Vector3): boolean;
        /**
         * Create a new matrix with just the rotation block from the argument matrix
         */
        static extractRotation(mtxTransform: Matrix): Matrix;
        /**
         * Returns a matrix representing the inverse rotation by simple transposition of the rotation block.
         */
        static rotationInverse(mtxRot: Matrix): Matrix;
        /**
         * Returns a matrix that is the orthonormal inverse of the argument matrix.
         * This is only valid if the input matrix is orthonormal
         * (the basis vectors are mutually perpendicular and of length 1)
         */
        static rigidInverse(mtxTransform: Matrix): Matrix;
        static componentWiseMin(vLHS: Vector3, vRHS: Vector3): Vector3;
        static componentWiseMax(vLHS: Vector3, vRHS: Vector3): Vector3;
        static componentWiseScale(vLHS: Vector3, vRHS: Vector3): Vector3;
        static componentWiseReciprocal(inVector: Vector3): Vector3;
        static minComponent(inVector: Vector3): number;
        static maxComponent(inVector: Vector3): number;
        /**
         * Compute the polar/spherical heading of a vector direction in z/x plane
         */
        static heading(inVector: Vector3): number;
        /**
         * Compute the spherical elevation of a vector direction in y above the z/x plane
         */
        static elevation(inVector: Vector3): number;
        /**
         * Set magnitude to 1 and bring heading to [-Pi,Pi], elevation into [-Pi/2, Pi/2]
         *
         * @param vSpherical The Vector3 to convert.
         * @return The normalized spherical Vector3.
         *
         */
        static normalizeSpherical(vSpherical: Vector3): Vector3;
        /**
         * Convert from Cartesian (rectangular) coordinates to spherical coordinates
         * (magnitude, heading, elevation).
         *
         * @param vCartesian The Vector3 to convert.
         * @return The cartesian Vector3 converted to spherical.
         *
         */
        static cartesianToSpherical(vCartesian: Vector3): Vector3;
        /**
         * Convert from spherical coordinates (magnitude, heading, elevation) to
         * Cartesian (rectangular) coordinates.
         *
         * @param vSpherical The Vector3 to convert.
         * @return The spherical Vector3 converted to cartesian.
         *
         */
        static sphericalToCartesian(vSpherical: Vector3): Vector3;
        /**
         * Clamps a value between a minimum Number and maximum Number value.
         *
         * @param inVal The number to clamp.
         * @param minVal The minimum value.
         * @param maxVal The maximum value.
         * @return The value clamped between minVal and maxVal.
         *
         */
        static clamp(inVal: number, minVal: number, maxVal: number): number;
        /**
         * Linearly interpolates between two Numbers.
         *
         * @param a A number.
         * @param b A number.
     * @param coefficient The interpolation coefficient [0-1].
         * @return The interpolated number.
         *
         */
        static lerp(a: number, b: number, coefficient: number): number;
        /**
         * Linearly interpolates between two Vector3 objects.
         *
         * @param vec1 A Vector3 object.
         * @param vec2 A Vector3 object.
         * @param coefficient The interpolation coefficient [0-1].
         * @return A new interpolated Vector3 object.
         *
         */
        static lerpVector(vec1: Vector3, vec2: Vector3, coefficient: number): Vector3;
    }
    /**
     * The Controller class is your main interface to the Leap Motion Controller.
     *
     * <p>Create an instance of this Controller class to access frames of tracking
     * data and configuration information. Frame data can be polled at any time using
     * the <code>Controller::frame()</code> . Call <code>frame()</code> or <code>frame(0)</code>
     * to get the most recent frame. Set the history parameter to a positive integer
     * to access previous frames. A controller stores up to 60 frames in its frame history.</p>
     *
     * <p>Polling is an appropriate strategy for applications which already have an
     * intrinsic update loop, such as a game. You can also implement the Leap::Listener
     * interface to handle events as they occur. The Leap dispatches events to the listener
     * upon initialization and exiting, on connection changes, and when a new frame
     * of tracking data is available. When these events occur, the controller object
     * invokes the appropriate callback defined in the Listener interface.</p>
     *
     * <p>To access frames of tracking data as they become available:</p>
     *
     * <ul>
     * <li>Implement the Listener interface and override the <code>Listener::onFrame()</code> .</li>
     * <li>In your <code>Listener::onFrame()</code> , call the <code>Controller::frame()</code> to access the newest frame of tracking data.</li>
     * <li>To start receiving frames, create a Controller object and add event listeners to the <code>Controller::addEventListener()</code> .</li>
     * </ul>
     *
     * <p>When an instance of a Controller object has been initialized,
     * it calls the <code>Listener::onInit()</code> when the listener is ready for use.
     * When a connection is established between the controller and the Leap,
     * the controller calls the <code>Listener::onConnect()</code> . At this point,
     * your application will start receiving frames of data. The controller calls
     * the <code>Listener::onFrame()</code> each time a new frame is available.
     * If the controller loses its connection with the Leap software or
     * device for any reason, it calls the <code>Listener::onDisconnect()</code> .
     * If the listener is removed from the controller or the controller is destroyed,
     * it calls the <code>Listener::onExit()</code> . At that point, unless the listener
     * is added to another controller again, it will no longer receive frames of tracking data.</p>
     *
     * @author logotype
     *
     */
    export class Controller extends EventDispatcher {
        /**
         * @private
         * The Listener subclass instance.
         */
        private listener;
        /**
         * @private
         * History of frame of tracking data from the Leap.
         */
        frameHistory: Frame[];
        /**
         * Most recent received Frame.
         */
        private latestFrame;
        /**
         * Socket connection.
         */
        connection: WebSocket;
        lastConnectionFrame: Frame;
        lastFrame: Frame;
        lastValidFrame: Frame;
        /**
         * Constructs a Controller object.
         * @param host IP or hostname of the computer running the Leap software.
         * (currently only supported for socket connections).
         *
         */
        constructor(host?: string);
        /**
         * Finds a Hand object by ID.
         *
         * @param frame The Frame object in which the Hand contains
         * @param id The ID of the Hand object
         * @return The Hand object if found, otherwise null
         *
         */
        private static getHandByID(frame, id);
        /**
         * Finds a Pointable object by ID.
         *
         * @param frame The Frame object in which the Pointable contains
         * @param id The ID of the Pointable object
         * @return The Pointable object if found, otherwise null
         *
         */
        private static getPointableByID(frame, id);
        /**
         * Returns a frame of tracking data from the Leap.
         *
         * <p>Use the optional history parameter to specify which frame to retrieve.
         * Call <code>frame()</code> or <code>frame(0)</code> to access the most recent frame;
         * call <code>frame(1)</code> to access the previous frame, and so on. If you use a history value
         * greater than the number of stored frames, then the controller returns
         * an invalid frame.</p>
         *
         * @param history The age of the frame to return, counting backwards from
         * the most recent frame (0) into the past and up to the maximum age (59).
         *
         * @return The specified frame; or, if no history parameter is specified,
         * the newest frame. If a frame is not available at the specified
         * history position, an invalid Frame is returned.
         *
         */
        frame(history?: number): Frame;
        /**
         * Update the object that receives direct updates from the Leap Motion Controller.
         *
         * <p>The default listener will make the controller dispatch flash events.
         * You can override this behaviour, by implementing the IListener interface
         * in your own classes, and use this method to set the listener to your
         * own implementation.</p>
         *
         * @param listener
         */
        setListener(listener: Listener): void;
        /**
         * Enables or disables reporting of a specified gesture type.
         *
         * <p>By default, all gesture types are disabled. When disabled, gestures of
         * the disabled type are never reported and will not appear in the frame
         * gesture list.</p>
         *
         * <p>As a performance optimization, only enable recognition for the types
         * of movements that you use in your application.</p>
         *
         * @param type The type of gesture to enable or disable. Must be a member of the Gesture::Type enumeration.
         * @param enable True, to enable the specified gesture type; False, to disable.
         *
         */
        enableGesture(type: Type, enable?: boolean): void;
        /**
         * Reports whether the specified gesture type is enabled.
         *
         * @param type The Gesture.TYPE parameter.
         * @return True, if the specified type is enabled; false, otherwise.
         *
         */
        isGestureEnabled(type: Type): boolean;
        /**
         * Reports whether this Controller is connected to the Leap Motion Controller.
         *
         * <p>When you first create a Controller object, <code>connected()</code> returns false.
         * After the controller finishes initializing and connects to
         * the Leap, <code>connected()</code> will return true.</p>
         *
         * <p>You can either handle the onConnect event using a event listener
         * or poll the <code>connected()</code> if you need to wait for your
         * application to be connected to the Leap before performing
         * some other operation.</p>
         *
         * @return True, if connected; false otherwise.
         *
         */
        connected(): boolean;
    }
    /**
     * The InteractionBox class represents a box-shaped region completely within
     * the field of view of the Leap Motion controller.
     *
     * <p>The interaction box is an axis-aligned rectangular prism and provides
     * normalized coordinates for hands, fingers, and tools within this box.
     * The InteractionBox class can make it easier to map positions in the
     * Leap Motion coordinate system to 2D or 3D coordinate systems used
     * for application drawing.</p>
     *
     * <p>The InteractionBox region is defined by a center and dimensions along the x, y, and z axes.</p>
     *
     * @author logotype
     *
     */
    export class InteractionBox {
        /**
         * The center of the InteractionBox in device coordinates (millimeters).
         * <p>This point is equidistant from all sides of the box.</p>
         */
        center: Vector3;
        /**
         * The depth of the InteractionBox in millimeters, measured along the z-axis.
         *
         */
        depth: number;
        /**
         * The height of the InteractionBox in millimeters, measured along the y-axis.
         *
         */
        height: number;
        /**
         * The width of the InteractionBox in millimeters, measured along the x-axis.
         *
         */
        width: number;
        constructor();
        /**
         * Converts a position defined by normalized InteractionBox coordinates
         * into device coordinates in millimeters.
         *
         * This function performs the inverse of normalizePoint().
         *
         * @param normalizedPosition The input position in InteractionBox coordinates.
         * @return The corresponding denormalized position in device coordinates.
         *
         */
        denormalizePoint(normalizedPosition: Vector3): Vector3;
        /**
         * Normalizes the coordinates of a point using the interaction box.
         *
         * <p>Coordinates from the Leap Motion frame of reference (millimeters) are
         * converted to a range of [0..1] such that the minimum value of the
         * InteractionBox maps to 0 and the maximum value of the InteractionBox maps to 1.</p>
         *
         * @param position The input position in device coordinates.
         * @param clamp Whether or not to limit the output value to the range [0,1]
         * when the input position is outside the InteractionBox. Defaults to true.
         * @return The normalized position.
         *
         */
        normalizePoint(position: Vector3, clamp?: boolean): Vector3;
        /**
         * Reports whether this is a valid InteractionBox object.
         * @return True, if this InteractionBox object contains valid data.
         *
         */
        isValid(): boolean;
        /**
         * Compare InteractionBox object equality/inequality.
         *
         * <p>Two InteractionBox objects are equal if and only if both InteractionBox
         * objects represent the exact same InteractionBox and both InteractionBoxes are valid.</p>
         *
         * @param other
         * @return
         *
         */
        isEqualTo(other: InteractionBox): boolean;
        /**
         * Returns an invalid InteractionBox object.
         *
         * <p>You can use the instance returned by this function in comparisons
         * testing whether a given InteractionBox instance is valid or invalid.
         * (You can also use the <code>InteractionBox.isValid()</code> function.)</p>
         *
         * @return The invalid InteractionBox instance.
         *
         */
        static invalid(): InteractionBox;
        /**
         * Writes a brief, human readable description of the InteractionBox object.
         * @return A description of the InteractionBox as a string.
         *
         */
        toString(): string;
    }
    export class Pointable {
        /**
         * The current touch zone of this Pointable object.
         *
         * <p>The Leap Motion software computes the touch zone based on a
         * floating touch plane that adapts to the user's finger movement
         * and hand posture. The Leap Motion software interprets purposeful
         * movements toward this plane as potential touch points.
         * When a Pointable moves close to the adaptive touch plane,
         * it enters the "hovering" zone. When a Pointable reaches or
         * passes through the plane, it enters the "touching" zone.</p>
         *
         * <p>The possible states are present in the Zone enum of this class:</p>
         *
         * <code>Zone.NONE – The Pointable is outside the hovering zone.
         * Zone.HOVERING – The Pointable is close to, but not touching the touch plane.
         * Zone.TOUCHING – The Pointable has penetrated the touch plane.</code>
         *
         * <p>The touchDistance value provides a normalized indication of the
         * distance to the touch plane when the Pointable is in the hovering
         * or touching zones.</p>
         *
         */
        touchZone: number;
        /**
         * A value proportional to the distance between this Pointable
         * object and the adaptive touch plane.
         *
         * <p>The touch distance is a value in the range [-1, 1].
         * The value 1.0 indicates the Pointable is at the far edge of
         * the hovering zone. The value 0 indicates the Pointable is
         * just entering the touching zone. A value of -1.0 indicates
         * the Pointable is firmly within the touching zone.
         * Values in between are proportional to the distance from the plane.
         * Thus, the touchDistance of 0.5 indicates that the Pointable
         * is halfway into the hovering zone.</p>
         *
         * <p>You can use the touchDistance value to modulate visual
         * feedback given to the user as their fingers close in on a
         * touch target, such as a button.</p>
         *
         */
        touchDistance: number;
        /**
         * The direction in which this finger or tool is pointing.<br/>
         * The direction is expressed as a unit vector pointing in the
         * same direction as the tip.
         */
        direction: Vector3;
        /**
         * The Frame associated with this Pointable object.<br/>
         * The associated Frame object, if available; otherwise, an invalid
         * Frame object is returned.
         * @see Frame
         */
        frame: Frame;
        /**
         * The Hand associated with this finger or tool.<br/>
         * The associated Hand object, if available; otherwise, an invalid
         * Hand object is returned.
         * @see Hand
         */
        hand: Hand;
        /**
         * A unique ID assigned to this Pointable object, whose value remains
         * the same across consecutive frames while the tracked finger or
         * tool remains visible.
         *
         * <p>If tracking is lost (for example, when a finger is occluded by another
         * finger or when it is withdrawn from the Leap field of view), the Leap
         * may assign a new ID when it detects the entity in a future frame.</p>
         *
         * <p>Use the ID value with the <code>Frame.pointable()</code> to find this
         * Pointable object in future frames.</p>
         */
        id: number;
        /**
         * The estimated length of the finger or tool in millimeters.
         *
         * <p>The reported length is the visible length of the finger or tool from
         * the hand to tip.</p>
         *
         * <p>If the length isn't known, then a value of 0 is returned.</p>
         */
        length: number;
        /**
         * The estimated width of the finger or tool in millimeters.
         *
         * <p>The reported width is the average width of the visible portion
         * of the finger or tool from the hand to the tip.</p>
         *
         * <p>If the width isn't known, then a value of 0 is returned.</p>
         */
        width: number;
        /**
         * The tip position in millimeters from the Leap origin.
         */
        tipPosition: Vector3;
        /**
         * The stabilized tip position of this Pointable.
         * <p>Smoothing and stabilization is performed in order to make this value more suitable for interaction with 2D content.</p>
         * <p>A modified tip position of this Pointable object with some additional smoothing and stabilization applied.</p>
         */
        stabilizedTipPosition: Vector3;
        /**
         * The duration of time this Pointable has been visible to the Leap Motion Controller.
         * <p>The duration (in seconds) that this Pointable has been tracked.</p>
         */
        timeVisible: number;
        /**
         * The rate of change of the tip position in millimeters/second.
         */
        tipVelocity: Vector3;
        /**
         * Whether or not the Pointable is believed to be a finger.
         */
        isFinger: boolean;
        /**
         * Whether or not the Pointable is believed to be a tool.
         */
        isTool: boolean;
        constructor();
        /**
         * Reports whether this is a valid Pointable object.
         * @return True if <code>direction</code>, <code>tipPosition</code> and <code>tipVelocity</code> are true.
         */
        isValid(): boolean;
        /**
         * Compare Pointable object equality/inequality.
         *
         * <p>Two Pointable objects are equal if and only if both Pointable
         * objects represent the exact same physical entities in
         * the same frame and both Pointable objects are valid.</p>
         *
         * @param other The Pointable to compare with.
         * @return True; if equal, False otherwise.
         *
         */
        isEqualTo(other: Pointable): boolean;
        /**
         * Returns an invalid Pointable object.
         *
         * <p>You can use the instance returned by this in
         * comparisons testing whether a given Pointable instance
         * is valid or invalid.<br/>
         * (You can also use the <code>Pointable.isValid()</code> function.)</p>
         *
         * @return The invalid Pointable instance.
         *
         */
        static invalid(): Pointable;
        /**
         * A string containing a brief, human readable description of the Pointable object.
         */
        toString(): string;
    }
    /**
     * The Gesture class represents a recognized movement by the user.
     *
     * <p>The Leap watches the activity within its field of view for certain movement
     * patterns typical of a user gesture or command. For example, a movement from
     * side to side with the hand can indicate a swipe gesture, while a finger poking
     * forward can indicate a screen tap gesture.</p>
     *
     * <p>When the Leap recognizes a gesture, it assigns an ID and adds a Gesture object
     * to the frame gesture list. For continuous gestures, which occur over many frames,
     * the Leap updates the gesture by adding a Gesture object having the same ID and
     * updated properties in each subsequent frame.</p>
     *
     * <p><strong>Important: Recognition for each type of gesture must be enabled using the
     * <code>Controller.enableGesture()</code> function; otherwise no gestures are recognized
     * or reported.</strong></p>
     *
     * <p>Subclasses of Gesture define the properties for the specific movement
     * patterns recognized by the Leap.</p>
     *
     * <p>The Gesture subclasses for include:
     * <pre>
     * CircleGesture – A circular movement by a finger.
     * SwipeGesture – A straight line movement by the hand with fingers extended.
     * ScreenTapGesture – A forward tapping movement by a finger.
     * KeyTapGesture – A downward tapping movement by a finger.
     * </pre>
     * </p>
     *
     * <p>Circle and swipe gestures are continuous and these objects can have a state
     * of start, update, and stop.</p>
     *
     * <p>The screen tap gesture is a discrete gesture. The Leap only creates a single
     * ScreenTapGesture object appears for each tap and it always has a stop state.</p>
     *
     * <p>Get valid Gesture instances from a Frame object. You can get a list of gestures
     * with the <code>Frame.gestures()</code> method. You can get a list of gestures since a specified
     * frame with the <code>Frame.gestures(frame)</code> methods. You can also use the <code>Frame.gesture()</code>
     * method to find a gesture in the current frame using an ID value obtained
     * in a previous frame.</p>
     *
     * <p>Gesture objects can be invalid. For example, when you get a gesture by ID using
     * <code>Frame.gesture()</code>, and there is no gesture with that ID in the current frame, then
     * <code>gesture()</code> returns an Invalid Gesture object (rather than a null value).
     * Always check object validity in situations where a gesture might be invalid.</p>
     *
     * <p>The following keys can be used with the Config class to configure the gesture recognizer:</p>
     *
     * <table class="innertable">
     *   <tr>
     *    <th>Key string</th>
     *    <th>Value type</th>
     *    <th>Default value</th>
     *    <th>Units</th>
     *  </tr>
     *   <tr>
     *    <td>Gesture.Circle.MinRadius</td>
     *    <td>float</td>
     *    <td>5.0</td>
     *    <td>mm</td>
     *  </tr>
     *   <tr>
     *    <td>Gesture.Circle.MinArc</td>
     *    <td>float</td>
     *    <td>1.5&#42;pi</td>
     *    <td>radians</td>
     *  </tr>
     *   <tr>
     *    <td>Gesture.Swipe.MinLength</td>
     *    <td>float</td>
     *    <td>150</td>
     *    <td>mm</td>
     *  </tr>
     *   <tr>
     *    <td>Gesture.Swipe.MinVelocity</td>
     *    <td>float</td>
     *    <td>1000</td>
     *    <td>mm/s</td>
     *  </tr>
     *   <tr>
     *    <td>Gesture.KeyTap.MinDownVelocity</td>
     *    <td>float</td>
     *    <td>50</td>
     *    <td>mm/s</td>
     *  </tr>
     *   <tr>
     *    <td>Gesture.KeyTap.HistorySeconds</td>
     *    <td>float</td>
     *    <td>0.1</td>
     *    <td>s</td>
     *  </tr>
     *   <tr>
     *    <td>Gesture.KeyTap.MinDistance</td>
     *    <td>float</td>
     *    <td>5.0</td>
     *    <td>mm</td>
     *  </tr>
     *   <tr>
     *    <td>Gesture.ScreenTap.MinForwardVelocity</td>
     *    <td>float</td>
     *    <td>50</td>
     *    <td>mm/s</td>
     *  </tr>
     *   <tr>
     *    <td>Gesture.ScreenTap.HistorySeconds</td>
     *    <td>float</td>
     *    <td>0.1</td>
     *    <td>s</td>
     *  </tr>
     *   <tr>
     *    <td>Gesture.ScreenTap.MinDistance</td>
     *    <td>float</td>
     *    <td>3.0</td>
     *    <td>mm</td>
     *  </tr>
     * </table>
     *
     * @author logotype
     * @see CircleGesture
     * @see SwipeGesture
     * @see ScreenTapGesture
     * @see KeyTapGesture
     * @see Config
     *
     */
    /**
     * The possible gesture states.
     */
    export enum State {
        /**
         * An invalid state.
         */
        STATE_INVALID = 0,
        /**
         * The gesture is starting.<br/>
         * Just enough has happened to recognize it.
         */
        STATE_START = 1,
        /**
         * The gesture is in progress.<br/>
         * (Note: not all gestures have updates).
         */
        STATE_UPDATE = 2,
        /**
         * The gesture has completed or stopped.
         */
        STATE_STOP = 3,
    }
    /**
     * The supported types of gestures.
     */
    export enum Type {
        /**
         * An invalid type.
         */
        TYPE_INVALID = 4,
        /**
         * A straight line movement by the hand with fingers extended.
         */
        TYPE_SWIPE = 5,
        /**
         * A circular movement by a finger.
         */
        TYPE_CIRCLE = 6,
        /**
         * A forward tapping movement by a finger.
         */
        TYPE_SCREEN_TAP = 7,
        /**
         * A downward tapping movement by a finger.
         */
        TYPE_KEY_TAP = 8,
    }
    export class Gesture {
        /**
         * The elapsed duration of the recognized movement up to the frame
         * containing this Gesture object, in microseconds.
         *
         * <p>The duration reported for the first Gesture in the sequence (with
         * the <code>STATE_START</code> state) will typically be a small positive number
         * since the movement must progress far enough for the Leap to recognize
         * it as an intentional gesture.</p>
         */
        duration: number;
        /**
         * The elapsed duration in seconds.
         */
        durationSeconds: number;
        /**
         * The Frame containing this Gesture instance.
         */
        frame: Frame;
        /**
         * The list of hands associated with this Gesture, if any.
         *
         * <p>If no hands are related to this gesture, the list is empty.</p>
         */
        hands: Hand[];
        /**
         * The gesture ID.
         *
         * <p>All Gesture objects belonging to the same recognized movement share
         * the same ID value. Use the ID value with the Frame.gesture() method
         * to find updates related to this Gesture object in subsequent frames.</p>
         */
        id: number;
        /**
         * The list of fingers and tools associated with this Gesture, if any.
         *
         * <p>If no Pointable objects are related to this gesture, the list is empty.</p>
         */
        pointables: Pointable[];
        /**
         * The gesture state.
         *
         * <p>Recognized movements occur over time and have a beginning, a middle,
         * and an end. The <code>state</code> attribute reports where in that sequence
         * this Gesture object falls.</p>
         */
        state: State;
        /**
         * The gesture type.
         */
        type: Type;
        /**
         * Constructs a new Gesture object.
         *
         * <p>An uninitialized Gesture object is considered invalid. Get valid
         * instances of the Gesture class, which will be one of the Gesture
         * subclasses, from a Frame object.</p>
         *
         */
        constructor();
        /**
         * Compare Gesture object equality/inequality.
         *
         * <p>Two Gestures are equal if they represent the same snapshot of
         * the same recognized movement.</p>
         *
         * @param other The Gesture to compare with.
         * @return True; if equal, False otherwise.
         *
         */
        isEqualTo(other: Gesture): boolean;
        /**
         * Reports whether this Gesture instance represents a valid Gesture.
         *
         * <p>An invalid Gesture object does not represent a snapshot of a recognized
         * movement. Invalid Gesture objects are returned when a valid object
         * cannot be provided. For example, when you get an gesture by ID using
         * Frame.gesture(), and there is no gesture with that ID in the current
         * frame, then gesture() returns an Invalid Gesture object (rather than
         * a null value). Always check object validity in situations where an
         * gesture might be invalid.</p>
         *
         * @return True, if this is a valid Gesture instance; false, otherwise.
         *
         */
        isValid(): boolean;
        /**
         * Returns an invalid Gesture object.
         *
         * <p>You can use the instance returned by this in comparisons
         * testing whether a given Gesture instance is valid or invalid.
         * (You can also use the <code>Gesture.isValid()</code> function.)</p>
         *
         * @return The invalid Gesture instance.
         *
         */
        static invalid(): Gesture;
        /**
         * A string containing a brief, human-readable description of this Gesture.
         *
         */
        toString(): string;
    }
    /**
     * The Finger class represents a tracked finger.
     *
     * <p>Fingers are Pointable objects that the Leap has classified as a finger.
     * Get valid Finger objects from a Frame or a Hand object.</p>
     *
     * <p>Note that Finger objects can be invalid, which means that they do not
     * contain valid tracking data and do not correspond to a physical finger.
     * Invalid Finger objects can be the result of asking for a Finger object
     * using an ID from an earlier frame when no Finger objects with that ID
     * exist in the current frame. A Finger object created from the Finger
     * constructor is also invalid.<br/>
     * Test for validity with the <code>Finger.sValid()</code> function.</p>
     *
     * @author logotype
     *
     */
    export class Finger extends Pointable {
        bones: Bone[];

        extended: boolean;

        type: number;

        /**
         * Constructs a Finger object.
         *
         * <p>An uninitialized finger is considered invalid.
         * Get valid Finger objects from a Frame or a Hand object.</p>
         *
         */
        constructor();
        /**
         * Returns an invalid Finger object.
         *
         * <p>You can use the instance returned by this function in
         * comparisons testing whether a given Finger instance
         * is valid or invalid.
         * (You can also use the <code>Finger.isValid()</code> function.)</p>
         *
         * @return The invalid Finger instance.
         *
         */
        static invalid(): Finger;
    }
    export class Bone {
        type: number;

        center(): number[];
    }
    /**
     * The Tool class represents a tracked tool.
     *
     * <p>Tools are Pointable objects that the Leap has classified as a tool.
     * Tools are longer, thinner, and straighter than a typical finger.
     * Get valid Tool objects from a Frame or a Hand object.</p>
     *
     * <p>Note that Tool objects can be invalid, which means that they do not
     * contain valid tracking data and do not correspond to a physical tool.
     * Invalid Tool objects can be the result of asking for a Tool object
     * using an ID from an earlier frame when no Tool objects with that ID
     * exist in the current frame. A Tool object created from the Tool
     * constructor is also invalid. Test for validity with the
     * <code>Tool.isValid()</code> function.</p>
     *
     * @author logotype
     *
     */
    export class Tool extends Pointable {
        constructor();
        /**
         * Returns an invalid Tool object.
         *
         * <p>You can use the instance returned by this function in
         * comparisons testing whether a given Tool instance
         * is valid or invalid.
         * (You can also use the Tool.isValid property.)</p>
         *
         * @return The invalid Tool instance.
         *
         */
        static invalid(): Tool;
    }
    /**
     * The Hand class reports the physical characteristics of a detected hand.
     *
     * <p>Hand tracking data includes a palm position and velocity; vectors for
     * the palm normal and direction to the fingers; properties of a sphere fit
     * to the hand; and lists of the attached fingers and tools.</p>
     *
     * <p>Note that Hand objects can be invalid, which means that they do not
     * contain valid tracking data and do not correspond to a physical entity.
     * Invalid Hand objects can be the result of asking for a Hand object using
     * an ID from an earlier frame when no Hand objects with that ID exist in
     * the current frame. A Hand object created from the Hand constructor is
     * also invalid. Test for validity with the <code>Hand.isValid()</code> function.</p>
     *
     * @author logotype
     *
     */
    export class Hand {
        /**
         * Returns an invalid Hand object.
         *
         * <p>You can use the instance returned by this in comparisons
         * testing whether a given Hand instance is valid or invalid.
         * (You can also use the <code>Hand.isValid()</code> function.)</p>
         *
         * @return The invalid Hand instance.
         *
         */
        static Invalid: Hand;
        /**
         * The direction from the palm position toward the fingers.
         *
         * <p>The direction is expressed as a unit vector pointing in the same
         * direction as the directed line from the palm position to the fingers.</p>
         */
        direction: Vector3;
        /**
         * The list of Finger objects detected in this frame that are attached
         * to this hand, given in arbitrary order.
         * @see Finger
         */
        fingers: Finger[];
        /**
         * The Frame associated with this Hand.
         * @see Frame
         */
        frame: Frame;
        /**
         * A unique ID assigned to this Hand object, whose value remains
         * the same across consecutive frames while the tracked hand remains visible.
         *
         * <p>If tracking is lost (for example, when a hand is occluded by another
         * hand or when it is withdrawn from or reaches the edge of the Leap field
         * of view), the Leap may assign a new ID when it detects the hand in a future frame.</p>
         *
         * <p>Use the ID value with the <code>Frame.hand()</code> to find this Hand object
         * in future frames.</p>
         */
        id: number;
        indexFinger: Finger;
        /**
         * The normal vector to the palm.
         */
        palmNormal: Vector3;
        /**
         * The center position of the palm in millimeters from the Leap origin.
         */
        palmPosition: Vector3;
        /**
         * The stabilized palm position of this Hand.
         * <p>Smoothing and stabilization is performed in order to make this value more suitable for interaction with 2D content.</p>
         * <p>A modified palm position of this Hand object with some additional smoothing and stabilization applied.</p>
         */
        stabilizedPalmPosition: Vector3;
        /**
         * The duration of time this Hand has been visible to the Leap Motion Controller.
         * <p>The duration (in seconds) that this Hand has been tracked.</p>
         */
        timeVisible: number;
        /**
         * The rate of change of the palm position in millimeters/second.
         */
        palmVelocity: Vector3;
        /**
         * The list of Pointable objects (fingers and tools) detected in this
         * frame that are associated with this hand, given in arbitrary order.
         *
         * <p>The list can be empty if no fingers or tools associated with this hand are detected.
         * Use the <code>Pointable.isFinger()</code> to determine whether or not an item in the
         * list represents a finger. Use the <code>Pointable.isTool()</code> to determine
         * whether or not an item in the list represents a tool. You can also get
         * only fingers using the <code>Hand.fingers()</code> or only tools using
         * the <code>Hand.tools()</code> function.</p>
         *
         * @see Pointable
         *
         */
        pointables: Pointable[];
        /**
         * The center of a sphere fit to the curvature of this hand.
         */
        sphereCenter: Vector3;
        /**
         * The radius of a sphere fit to the curvature of this hand.
         */
        sphereRadius: number;
        /**
         * The list of Tool objects detected in this frame that are held by this hand, given in arbitrary order.
         * @see Tool
         */
        tools: Tool[];
        /**
         * Rotation matrix.
         */
        rotation: Matrix;
        /**
         * Scale factor since last Frame.
         */
        scaleFactorNumber: number;
        /**
         * Translation since last Frame.
         */
        translationVector: Vector3;
        /**
         * Reports whether this is a valid Hand object.
         * @return True, if this Hand object contains valid tracking data.
         *
         */
        valid: boolean;
        /**
         * Constructs a Hand object.
         *
         * <p>An uninitialized hand is considered invalid.
         *
         * Get valid Hand objects from a Frame object.</p>
         *
         */
        constructor();
        /**
         * The Finger object with the specified ID attached to this hand.
         *
         * <p>Use the <code>Hand.finger()</code> to retrieve a Finger object attached
         * to this hand using an ID value obtained from a previous frame.
         * This always returns a Finger object, but if no finger
         * with the specified ID is present, an invalid Finger object is returned.</p>
         *
         * <p>Note that ID values persist across frames, but only until tracking of
         * a particular object is lost. If tracking of a finger is lost and
         * subsequently regained, the new Finger object representing that
         * finger may have a different ID than that representing the finger in an earlier frame.</p>
         *
         * @param id The ID value of a Finger object from a previous frame.
         * @return The Finger object with the matching ID if one exists for
         * this hand in this frame; otherwise, an invalid Finger object is returned.
         * @see Finger
         *
         */
        finger(id: number): Finger;
        /**
         * The axis of rotation derived from the change in orientation
         * of this hand, and any associated fingers and tools,
         * between the current frame and the specified frame.
         *
         * <p>The returned direction vector is normalized.</p>
         *
         * <p>If a corresponding Hand object is not found in sinceFrame,
         * or if either this frame or sinceFrame are invalid Frame objects,
         * then this method returns a zero vector.</p>
         *
         * @param sinceFrame The starting frame for computing the relative rotation.
         * @return A normalized direction Vector representing the heuristically
         * determined axis of rotational change of the hand between the current
         * frame and that specified in the sinceFrame parameter.
         * @see Vector3
         *
         */
        rotationAxis(sinceFrame: Frame): Vector3;
        /**
         * The angle of rotation around the rotation axis derived from the
         * overall rotational motion between the current frame and the specified frame.
         *
         * <p>The returned angle is expressed in radians measured clockwise around
         * the rotation axis (using the right-hand rule) between the
         * start and end frames. The value is always between 0 and pi radians (0 and 180 degrees).</p>
         *
         * <p>The Leap derives frame rotation from the relative change in position
         * and orientation of all objects detected in the field of view.</p>
         *
         * <p>If either this frame or sinceFrame is an invalid Frame object,
         * then the angle of rotation is zero.</p>
         *
         * @param sinceFrame The starting frame for computing the relative rotation.
         * @param axis Optional. The axis to measure rotation around.
         * @return A positive value containing the heuristically determined rotational
         * change between the current frame and that specified in the sinceFrame parameter.
         *
         */
        rotationAngle(sinceFrame: Frame, axis?: Vector3): number;
        /**
         * The transform matrix expressing the rotation derived from
         * the change in orientation of this hand, and any associated
         * fingers and tools, between the current frame and the specified frame.
         *
         * <p>If a corresponding Hand object is not found in sinceFrame,
         * or if either this frame or sinceFrame are invalid Frame objects,
         * then this method returns an identity matrix.</p>
         *
         * @param sinceFrame
         * @return A transformation Matrix representing the heuristically
         * determined rotational change of the hand between the current
         * frame and that specified in the sinceFrame parameter.
         * @see Matrix
         * @see Frame
         *
         */
        rotationMatrix(sinceFrame: Frame): Matrix;
        /**
         * The scale factor derived from this hand's motion between
         * the current frame and the specified frame.
         *
         * <p>The scale factor is always positive. A value of 1.0 indicates no
         * scaling took place. Values between 0.0 and 1.0 indicate contraction
         * and values greater than 1.0 indicate expansion.</p>
         *
         * <p>The Leap derives scaling from the relative inward or outward motion
         * of a hand and its associated fingers and tools (independent of
         * translation and rotation).</p>
         *
         * <p>If a corresponding Hand object is not found in sinceFrame,
         * or if either this frame or sinceFrame are invalid Frame objects,
         * then this method returns 1.0.</p>
         *
         * @param sinceFrame The starting frame for computing the relative scaling.
         * @return A positive value representing the heuristically determined
         * scaling change ratio between the current frame and that specified
         * in the sinceFrame parameter.
         *
         */
        scaleFactor(sinceFrame: Frame): number;
        /**
         * The change of position of this hand between the current frame and the specified frame.
         *
         * @param sinceFrame The starting frame for computing the translation.
         * @return A Vector representing the heuristically determined change
         * in hand position between the current frame and that specified
         * in the sinceFrame parameter.
         * @see Vector3
         *
         */
        translation(sinceFrame: Frame): Vector3;
    }
    /**
     * The Frame class represents a set of hand and finger tracking
     * data detected in a single frame.
     *
     * <p>The Leap detects hands, fingers and tools within the tracking area,
     * reporting their positions, orientations and motions in frames at
     * the Leap frame rate.</p>
     *
     * <p>Access Frame objects through a listener of a Leap Controller.
     * Add a listener to receive events when a new Frame is available.</p>
     *
     * @author logotype
     *
     */
    export class Frame {
        /**
         * The list of Finger objects detected in this frame, given in arbitrary order.<br/>
         * The list can be empty if no fingers are detected.
         */
        fingers: Finger[];
        /**
         * The list of Hand objects detected in this frame, given in arbitrary order.<br/>
         * The list can be empty if no hands are detected.
         */
        hands: Hand[];
        /**
         * The Pointable object with the specified ID in this frame.
         *
         * <p>Use the <code>Frame.pointable()</code> to retrieve the Pointable
         * object from this frame using an ID value obtained from a previous frame.
         * This always returns a Pointable object, but if no finger
         * or tool with the specified ID is present, an invalid Pointable
         * object is returned.</p>
         *
         * <p>Note that ID values persist across frames, but only until tracking
         * of a particular object is lost. If tracking of a finger or tool is
         * lost and subsequently regained, the new Pointable object representing
         * that finger or tool may have a different ID than that representing
         * the finger or tool in an earlier frame.</p>
         *
         * @see Pointable
         *
         */
        pointables: Pointable[];
        /**
         * The gestures recognized or continuing in this frame.
         *
         * <p>Circle and swipe gestures are updated every frame.
         * Tap gestures only appear in the list when they start.</p>
         */
        _gestures: Gesture[];
        /**
         * A unique ID for this Frame.
         * <p>Consecutive frames processed by the Leap have consecutive increasing values.</p>
         */
        id: number;
        /**
         * The current framerate (in frames per second) of the Leap Motion Controller.
         * <p>This value may fluctuate depending on available computing resources,
         * activity within the device field of view, software tracking settings,
         * and other factors.</p>
         * <p>An estimate of frames per second of the Leap Motion Controller.</p>
         */
        currentFramesPerSecond: number;
        /**
         * The current InteractionBox for the frame.
         * <p>See the InteractionBox class documentation for more details on how this class should be used.</p>
         * @see InteractionBox
         */
        interactionBox: InteractionBox;
        /**
         * The frame capture time in microseconds elapsed since the Leap started.
         */
        timestamp: number;
        /**
         * The list of Tool objects detected in this frame, given in arbitrary order.
         *
         * @see Tool
         */
        tools: Tool[];
        /**
         * Rotation matrix.
         */
        rotation: Matrix;
        /**
         * Scale factor since last Frame.
         */
        scaleFactorNumber: number;
        /**
         * Translation since last Frame.
         */
        translationVector: Vector3;
        /**
         * Reference to the current Controller.
         */
        controller: Controller;
        /**
         * Reports whether this Frame instance is valid.
         *
         * <p>A valid Frame is one generated by the LeapMotion object that contains
         * tracking data for all detected entities. An invalid Frame contains
         * no actual tracking data, but you can call its functions without risk
         * of a null pointer exception. The invalid Frame mechanism makes it
         * more convenient to track individual data across the frame history.</p>
         *
         * <p>For example, you can invoke: <code>var finger:Finger = leap.frame(n).finger(fingerID);</code>
         * for an arbitrary Frame history value, "n", without first checking whether
         * frame(n) returned a null object.<br/>
         * (You should still check that the returned Finger instance is valid.)</p>
         */
        valid: boolean;
        /**
         * Constructs a Frame object.
         *
         * <p>Frame instances created with this constructor are invalid.
         * Get valid Frame objects by calling the <code>LeapMotion.frame()</code> function.</p>
         *
         */
        constructor();
        /**
         * The Hand object with the specified ID in this frame.
         *
         * <p>Use the <code>Frame.hand()</code> to retrieve the Hand object
         * from this frame using an ID value obtained from a previous frame.
         * This always returns a Hand object, but if no hand
         * with the specified ID is present, an invalid Hand object is returned.</p>
         *
         * <p>Note that ID values persist across frames, but only until tracking
         * of a particular object is lost. If tracking of a hand is lost
         * and subsequently regained, the new Hand object representing
         * that physical hand may have a different ID than that
         * representing the physical hand in an earlier frame.</p>
         *
         * @param id The ID value of a Hand object from a previous frame.
         * @return The Hand object with the matching ID if one exists
         * in this frame; otherwise, an invalid Hand object is returned.
         * @see Hand
         *
         */
        hand(id: number): Hand;
        /**
         * The Finger object with the specified ID in this frame.
         *
         * <p>Use the <code>Frame.finger()</code> to retrieve the Finger
         * object from this frame using an ID value obtained from a
         * previous frame. This always returns a Finger object,
         * but if no finger with the specified ID is present, an
         * invalid Finger object is returned.</p>
         *
         * <p>Note that ID values persist across frames, but only until
         * tracking of a particular object is lost. If tracking of a
         * finger is lost and subsequently regained, the new Finger
         * object representing that physical finger may have a different
         * ID than that representing the finger in an earlier frame.</p>
         *
         * @param id The ID value of a Finger object from a previous frame.
         * @return The Finger object with the matching ID if one exists
         * in this frame; otherwise, an invalid Finger object is returned.
         * @see Finger
         *
         */
        finger(id: number): Finger;
        /**
         * The Tool object with the specified ID in this frame.
         *
         * <p>Use the <code>Frame.tool()</code> to retrieve the Tool
         * object from this frame using an ID value obtained from
         * a previous frame. This always returns a Tool
         * object, but if no tool with the specified ID is present,
         * an invalid Tool object is returned.</p>
         *
         * <p>Note that ID values persist across frames, but only until
         * tracking of a particular object is lost. If tracking of a
         * tool is lost and subsequently regained, the new Tool
         * object representing that tool may have a different ID
         * than that representing the tool in an earlier frame.</p>
         *
         * @param id The ID value of a Tool object from a previous frame.
         * @return The Tool object with the matching ID if one exists in
         * this frame; otherwise, an invalid Tool object is returned.
         * @see Tool
         *
         */
        tool(id: number): Tool;
        /**
         * The Pointable object with the specified ID in this frame.
         *
         * <p>Use the <code>Frame.pointable()</code> to retrieve the Pointable
         * object from this frame using an ID value obtained from a previous frame.
         * This always returns a Pointable object, but if no finger
         * or tool with the specified ID is present, an invalid
         * Pointable object is returned.</p>
         *
         * <p>Note that ID values persist across frames, but only until tracking
         * of a particular object is lost. If tracking of a finger or tool is
         * lost and subsequently regained, the new Pointable object representing
         * that finger or tool may have a different ID than that representing
         * the finger or tool in an earlier frame.</p>
         *
         * @param id The ID value of a Pointable object from a previous frame.
         * @return The Pointable object with the matching ID if one exists
         * in this frame; otherwise, an invalid Pointable object is returned.
         *
         */
        pointable(id: number): Pointable;
        /**
         * The Gesture object with the specified ID in this frame.
         *
         * <p>Use the <code>Frame.gesture()</code> to return a Gesture object in this frame
         * using an ID obtained in an earlier frame. The always returns a
         * Gesture object, but if there was no update for the gesture in this frame,
         * then an invalid Gesture object is returned.</p>
         *
         * <p>All Gesture objects representing the same recognized movement share the same ID.</p>
         *
         * @param id The ID of an Gesture object from a previous frame.
         * @return The Gesture object in the frame with the specified ID if one
         * exists; Otherwise, an Invalid Gesture object.
         *
         */
        gesture(id: number): Gesture;
        /**
         * Returns a Gesture vector containing all gestures that have occurred
         * since the specified frame.
         *
         * <p>If no frame is specifed, the gestures recognized or continuing in
         * this frame will be returned.</p>
         *
         * @param sinceFrame An earlier Frame object. The starting frame must
         * still be in the frame history cache, which has a default length of 60 frames.
         * @return The list of gestures.
         *
         */
        gestures(sinceFrame?: Frame): Gesture[];
        /**
         * The axis of rotation derived from the overall rotational
         * motion between the current frame and the specified frame.
         *
         * <p>The returned direction vector is normalized.</p>
         *
         * <p>The Leap derives frame rotation from the relative change
         * in position and orientation of all objects detected in
         * the field of view.</p>
         *
         * <p>If either this frame or sinceFrame is an invalid Frame
         * object, or if no rotation is detected between the
         * two frames, a zero vector is returned.</p>
         *
         * @param sinceFrame The starting frame for computing the relative rotation.
         * @return A normalized direction Vector representing the axis of the
         * heuristically determined rotational change between the current
         * frame and that specified in the sinceFrame parameter.
         *
         */
        rotationAxis(sinceFrame: Frame): Vector3;
        /**
         * The angle of rotation around the rotation axis derived from the
         * overall rotational motion between the current frame and the specified frame.
         *
         * <p>The returned angle is expressed in radians measured clockwise around
         * the rotation axis (using the right-hand rule) between the
         * start and end frames. The value is always between 0 and pi radians (0 and 180 degrees).</p>
         *
         * <p>The Leap derives frame rotation from the relative change in position
         * and orientation of all objects detected in the field of view.</p>
         *
         * <p>If either this frame or sinceFrame is an invalid Frame object,
         * then the angle of rotation is zero.</p>
         *
         * @param sinceFrame The starting frame for computing the relative rotation.
         * @param axis Optional. The axis to measure rotation around.
         * @return A positive value containing the heuristically determined rotational
         * change between the current frame and that specified in the sinceFrame parameter.
         *
         */
        rotationAngle(sinceFrame: Frame, axis?: Vector3): number;
        /**
         * The transform matrix expressing the rotation derived from
         * the change in orientation of this hand, and any associated
         * fingers and tools, between the current frame and the specified frame.
         *
         * <p>If a corresponding Hand object is not found in sinceFrame,
         * or if either this frame or sinceFrame are invalid Frame objects,
         * then this method returns an identity matrix.</p>
         *
         * @param sinceFrame
         * @return
         *
         */
        rotationMatrix(sinceFrame: Frame): Matrix;
        /**
         * The scale factor derived from the overall motion between the
         * current frame and the specified frame.
         *
         * <p>The scale factor is always positive. A value of 1.0 indicates no
         * scaling took place. Values between 0.0 and 1.0 indicate contraction
         * and values greater than 1.0 indicate expansion.</p>
         *
         * <p>The Leap derives scaling from the relative inward or outward
         * motion of all objects detected in the field of view (independent
         * of translation and rotation).</p>
         *
         * <p>If either this frame or sinceFrame is an invalid Frame object,
         * then this method returns 1.0.</p>
         *
         * @param sinceFrame The starting frame for computing the relative scaling.
         * @return A positive value representing the heuristically determined
         * scaling change ratio between the current frame and that specified
         * in the sinceFrame parameter.
         *
         */
        scaleFactor(sinceFrame: Frame): number;
        /**
         * The change of position derived from the overall linear motion
         * between the current frame and the specified frame.
         *
         * <p>The returned translation vector provides the magnitude and
         * direction of the movement in millimeters.</p>
         *
         * <p>The Leap derives frame translation from the linear motion
         * of all objects detected in the field of view.</p>
         *
         * <p>If either this frame or sinceFrame is an invalid Frame object,
         * then this method returns a zero vector.</p>
         *
         * @param sinceFrame The starting frame for computing the translation.
         * @return A Vector representing the heuristically determined change
         * in hand position between the current frame and that specified
         * in the sinceFrame parameter.
         *
         */
        translation(sinceFrame: Frame): Vector3;
        /**
         * Compare Frame object equality.
         *
         * <p>Two Frame objects are equal if and only if both Frame objects
         * represent the exact same frame of tracking data and both
         * Frame objects are valid.</p>
         *
         * @param other The Frame to compare with.
         * @return True; if equal. False otherwise.
         *
         */
        isEqualTo(other: Frame): boolean;
        /**
         * Returns an invalid Frame object.
         *
         * <p>You can use the instance returned by this in comparisons
         * testing whether a given Frame instance is valid or invalid.
         * (You can also use the <code>Frame.isValid()</code> function.)</p>
         *
         * @return The invalid Frame instance.
         *
         */
        static invalid(): Frame;
    }
    /**
     * The Matrix struct represents a transformation matrix.
     *
     * <p>To use this struct to transform a Vector, construct a matrix containing the
     * desired transformation and then use the <code>Matrix.transformPoint()</code> or
     * <code>Matrix.transformDirection()</code> functions to apply the transform.</p>
     *
     * <p>Transforms can be combined by multiplying two or more transform matrices
     * using the <code>multiply()</code> function.</p>
     *
     *
     * @author logotype
     *
     */
    export class Matrix {
        /**
         * The translation factors for all three axes.
         */
        origin: Vector3;
        /**
         * The rotation and scale factors for the x-axis.
         */
        xBasis: Vector3;
        /**
         * The rotation and scale factors for the y-axis.
         */
        yBasis: Vector3;
        /**
         * The rotation and scale factors for the z-axis.
         */
        zBasis: Vector3;
        /**
         * Constructs a transformation matrix from the specified basis vectors.
         * @param x A Vector specifying rotation and scale factors for the x-axis.
         * @param y A Vector specifying rotation and scale factors for the y-axis.
         * @param z A Vector specifying rotation and scale factors for the z-axis.
         * @param _origin A Vector specifying translation factors on all three axes.
         *
         */
        constructor(x: Vector3, y: Vector3, z: Vector3, _origin?: Vector3);
        /**
         * Sets this transformation matrix to represent a rotation around the specified vector.
         * This erases any previous rotation and scale transforms applied to this matrix,
         * but does not affect translation.
         *
         * @param _axis A Vector specifying the axis of rotation.
         * @param angleRadians The amount of rotation in radians.
         *
         */
        setRotation(_axis: Vector3, angleRadians: number): void;
        /**
         * Transforms a vector with this matrix by transforming its rotation, scale, and translation.
         * Translation is applied after rotation and scale.
         *
         * @param inVector The Vector to transform.
         * @return A new Vector representing the transformed original.
         *
         */
        transformPoint(inVector: Vector3): Vector3;
        /**
         * Transforms a vector with this matrix by transforming its rotation and scale only.
         * @param inVector The Vector to transform.
         * @return A new Vector representing the transformed original.
         *
         */
        transformDirection(inVector: Vector3): Vector3;
        /**
         * Performs a matrix inverse if the matrix consists entirely of rigid transformations (translations and rotations).
         * @return The rigid inverse of the matrix.
         *
         */
        rigidInverse(): Matrix;
        /**
         * Multiply transform matrices.
         * @param other A Matrix to multiply on the right hand side.
         * @return A new Matrix representing the transformation equivalent to applying the other transformation followed by this transformation.
         *
         */
        multiply(other: Matrix): Matrix;
        /**
         * Multiply transform matrices and assign the product.
         * @param other A Matrix to multiply on the right hand side.
         * @return This Matrix representing the transformation equivalent to applying the other transformation followed by this transformation.
         *
         */
        multiplyAssign(other: Matrix): Matrix;
        /**
         * Compare Matrix equality/inequality component-wise.
         * @param other The Matrix to compare with.
         * @return True; if equal, False otherwise.
         *
         */
        isEqualTo(other: Matrix): boolean;
        /**
         * Returns the identity matrix specifying no translation, rotation, and scale.
         * @return The identity matrix.
         *
         */
        static identity(): Matrix;
        /**
         * Write the matrix to a string in a human readable format.
         * @return
         *
         */
        toString(): string;
    }
    /**
     * The CircleGesture class represents a circular finger movement.
     *
     * <p>A circle movement is recognized when the tip of a finger draws
     * a circle within the Leap field of view.</p>
     *
     * <p><strong>Important: To use circle gestures in your application, you must
     * enable recognition of the circle gesture.</strong><br/>
     * You can enable recognition with:</p>
     *
     * <code>leap.controller.enableGesture(Gesture.TYPE_CIRCLE);</code>
     *
     * <p>Circle gestures are continuous. The CircleGesture objects for
     * the gesture have three possible states:</p>
     *
     * <p><code>Gesture.STATE_START</code> – The circle gesture has just started.
     * The movement has progressed far enough for the recognizer to classify it as a circle.</p>
     *
     * <p><code>Gesture.STATE_UPDATE</code> – The circle gesture is continuing.</p>
     *
     * <p><code>Gesture.STATE_STOP</code> – The circle gesture is finished.</p>
     *
     * <p>You can set the minimum radius and minimum arc length required for a
     * movement to be recognized as a circle using the config attribute of a
     * connected Controller object. Use the following keys to configure circle recognition:</p>
     *
     * <table class="innertable">
     *   <tr>
     *    <th>Key string</th>
     *    <th>Value type</th>
     *    <th>Default value</th>
     *    <th>Units</th>
     *  </tr>
     *   <tr>
     *    <td>Gesture.Circle.MinRadius</td>
     *    <td>float</td>
     *    <td>5.0</td>
     *    <td>mm</td>
     *  </tr>
     *   <tr>
     *    <td>Gesture.Circle.MinArc</td>
     *    <td>float</td>
     *    <td>1.5&#42;pi</td>
     *    <td>radians</td>
     *  </tr>
     * </table>
     *
     * <p>The following example demonstrates how to set the circle configuration parameters:</p>
     *
     * <listing>if(controller.config().setFloat(&quot;Gesture.Circle.MinRadius&quot;, 10.0) &amp;&amp;
     *       controller.config().setFloat(&quot;Gesture.Circle.MinArc&quot;, .5))
     *        controller.config().save();</listing>
     *
     * @author logotype
     * @see Gesture
     *
     */
    export class CircleGesture extends Gesture {
        /**
         * The circle gesture type.<br/>
         * The type value designating a circle gesture.
         */
        static classType: number;
        /**
         * The center point of the circle within the Leap frame of reference.<br/>
         * The center of the circle in mm from the Leap origin.
         */
        center: Vector3;
        /**
         * Returns the normal vector for the circle being traced.
         *
         * <p>If you draw the circle clockwise, the normal vector points in the
         * same general direction as the pointable object drawing the circle.
         * If you draw the circle counterclockwise, the normal points back
         * toward the pointable. If the angle between the normal and the
         * pointable object drawing the circle is less than 90 degrees,
         * then the circle is clockwise.</p>
         */
        normal: Vector3;
        /**
         * The Finger or Tool performing the circle gesture.
         */
        pointable: Pointable;
        /**
         * The number of times the finger tip has traversed the circle.
         *
         * <p>Progress is reported as a positive number of the number. For example,
         * a progress value of .5 indicates that the finger has gone halfway around,
         * while a value of 3 indicates that the finger has gone around the the
         * circle three times.</p>
         *
         * <p>Progress starts where the circle gesture began. Since it the circle must
         * be partially formed before the Leap can recognize it, progress will be
         * greater than zero when a circle gesture first appears in the frame.</p>
         */
        progress: number;
        /**
         * The circle radius in mm.
         */
        radius: number;
        /**
         * Constructs a new CircleGesture object.
         *
         * <p>An uninitialized CircleGesture object is considered invalid.
         * Get valid instances of the CircleGesture class from a Frame object.</p>
         *
         */
        constructor();
    }
    /**
     * The KeyTapGesture class represents a tapping gesture by a finger or tool.
     *
     * <p>A key tap gesture is recognized when the tip of a finger rotates down
     * toward the palm and then springs back to approximately the original
     * postion, as if tapping. The tapping finger must pause briefly before
     * beginning the tap.</p>
     *
     * <p><strong>Important: To use key tap gestures in your application, you must enable
     * recognition of the key tap gesture.</strong><br/>You can enable recognition with:</p>
     *
     * <code>leap.controller.enableGesture(Gesture.TYPE_KEY_TAP);</code>
     *
     * <p>Key tap gestures are discrete. The KeyTapGesture object representing a
     * tap always has the state, <code>STATE_STOP</code>. Only one KeyTapGesture object
     * is created for each key tap gesture recognized.</p>
     *
     * <p>You can set the minimum finger movement and velocity required for a movement
     * to be recognized as a key tap as well as adjust the detection window for evaluating
     * the movement using the config attribute of a connected Controller object.
     * Use the following configuration keys to configure key tap recognition:</p>
     *
     * <table class="innertable">
     *   <tr>
     *    <th>Key string</th>
     *    <th>Value type</th>
     *    <th>Default value</th>
     *    <th>Units</th>
     *  </tr>
     *   <tr>
     *    <td>Gesture.KeyTap.MinDownVelocity</td>
     *    <td>float</td>
     *    <td>50</td>
     *    <td>mm/s</td>
     *  </tr>
     *   <tr>
     *    <td>Gesture.KeyTap.HistorySeconds</td>
     *    <td>float</td>
     *    <td>0.1</td>
     *    <td>s</td>
     *  </tr>
     *   <tr>
     *    <td>Gesture.KeyTap.MinDistance</td>
     *    <td>float</td>
     *    <td>5.0</td>
     *    <td>mm</td>
     *  </tr>
     * </table>
     *
     * <p>The following example demonstrates how to set the screen tap configuration parameters:</p>
     *
     * <code>if(controller.config().setFloat(&quot;Gesture.KeyTap.MinDownVelocity&quot;, 40.0) &amp;&amp;
     *       controller.config().setFloat(&quot;Gesture.KeyTap.HistorySeconds&quot;, .2) &amp;&amp;
     *       controller.config().setFloat(&quot;Gesture.KeyTap.MinDistance&quot;, 8.0))
     *        controller.config().save();</code>
     *
     * @author logotype
     *
     */
    export class KeyTapGesture extends Gesture {
        /**
         * The type value designating a key tap gesture.
         */
        static classType: number;
        /**
         * The current direction of finger tip motion.
         *
         * <p>At the start of the key tap gesture, the direction points in the
         * direction of the tap. At the end of the key tap gesture, the direction
         * will either point toward the original finger tip position or it will
         * be a zero-vector, which indicates that finger movement stopped before
         * returning to the starting point.</p>
         */
        direction: Vector3;
        /**
         * The finger performing the key tap gesture.
         */
        pointable: Pointable;
        /**
         * The position where the key tap is registered.
         */
        position: Vector3;
        /**
         * The progess value is always 1.0 for a key tap gesture.
         */
        progress: number;
        /**
         * Constructs a new KeyTapGesture object.
         *
         * <p>An uninitialized KeyTapGesture object is considered invalid.
         * Get valid instances of the KeyTapGesture class from a Frame object.</p>
         *
         */
        constructor();
    }
    /**
     * The ScreenTapGesture class represents a tapping gesture by a finger or tool.
     *
     * <p>A screen tap gesture is recognized when the tip of a finger pokes forward
     * and then springs back to approximately the original postion, as if tapping
     * a vertical screen. The tapping finger must pause briefly before beginning the tap.</p>
     *
     * <strong>Important: To use screen tap gestures in your application, you must enable
     * recognition of the screen tap gesture.</strong><br/> You can enable recognition with:
     *
     * <code>leap.controller.enableGesture(Gesture.TYPE_SCREEN_TAP);</code>
     *
     * <p>ScreenTap gestures are discrete. The ScreenTapGesture object representing a
     * tap always has the state, <code>STATE_STOP</code>. Only one ScreenTapGesture object is
     * created for each screen tap gesture recognized.</p>
     *
     * <p>You can set the minimum finger movement and velocity required for a movement
     * to be recognized as a screen tap as well as adjust the detection window for
     * evaluating the movement using the config attribute of a connected Controller object.
     * Use the following keys to configure screen tap recognition:</p>
     *
     * <table class="innertable">
     *   <tr>
     *    <th>Key string</th>
     *    <th>Value type</th>
     *    <th>Default value</th>
     *    <th>Units</th>
     *  </tr>
     *   <tr>
     *    <td>Gesture.ScreenTap.MinForwardVelocity</td>
     *    <td>float</td>
     *    <td>50</td>
     *    <td>mm/s</td>
     *  </tr>
     *   <tr>
     *    <td>Gesture.ScreenTap.HistorySeconds</td>
     *    <td>float</td>
     *    <td>0.1</td>
     *    <td>s</td>
     *  </tr>
     *   <tr>
     *    <td>Gesture.ScreenTap.MinDistance</td>
     *    <td>float</td>
     *    <td>3.0</td>
     *    <td>mm</td>
     *  </tr>
     * </table>
     *
     * <p>The following example demonstrates how to set the screen tap configuration parameters:</p>
     *
     * <code> if(controller.config().setFloat(&quot;Gesture.ScreenTap.MinForwardVelocity&quot;, 30.0) &amp;&amp;
     *       controller.config().setFloat(&quot;Gesture.ScreenTap.HistorySeconds&quot;, .5) &amp;&amp;
     *       controller.config().setFloat(&quot;Gesture.ScreenTap.MinDistance&quot;, 1.0))
     *        controller.config().save();</code>
     *
     * @author logotype
     *
     */
    export class ScreenTapGesture extends Gesture {
        /**
         * The type value designating a screen tap gesture.
         */
        static classType: number;
        /**
         * The direction of finger tip motion.
         */
        direction: Vector3;
        /**
         * The finger performing the screen tap gesture.
         */
        pointable: Pointable;
        /**
         * The position where the screen tap is registered.
         */
        position: Vector3;
        /**
         * The progess value is always 1.0 for a screen tap gesture.
         */
        progress: number;
        /**
         * Constructs a new ScreenTapGesture object.
         *
         * <p>An uninitialized ScreenTapGesture object is considered invalid.
         * Get valid instances of the ScreenTapGesture class from a Frame object.</p>
         *
         */
        constructor();
    }
    /**
     * The SwipeGesture class represents a swiping motion of a finger or tool.
     *
     * <p><strong>Important: To use swipe gestures in your application, you must enable
     * recognition of the swipe gesture.</strong><br/>You can enable recognition with:</p>
     *
     * <p><code>leap.controller.enableGesture(Gesture.TYPE_SWIPE);</code></p>
     *
     * <p>Swipe gestures are continuous.</p>
     *
     * <p>You can set the minimum length and velocity required for a movement to be
     * recognized as a swipe using the config attribute of a connected Controller object.
     * Use the following keys to configure swipe recognition:</p>
     *
     * <table class="innertable">
     *   <tr>
     *    <th>Key string</th>
     *    <th>Value type</th>
     *    <th>Default value</th>
     *    <th>Units</th>
     *  </tr>
     *   <tr>
     *    <td>Gesture.Swipe.MinLength</td>
     *    <td>float</td>
     *    <td>150</td>
     *    <td>mm</td>
     *  </tr>
     *   <tr>
     *    <td>Gesture.Swipe.MinVelocity</td>
     *    <td>float</td>
     *    <td>1000</td>
     *    <td>mm/s</td>
     *  </tr>
     * </table>
     *
     * <p>The following example demonstrates how to set the swipe configuration parameters:</p>
     *
     * <code>if(controller.config().setFloat(&quot;Gesture.Swipe.MinLength&quot;, 200.0) &amp;&amp;
     *       controller.config().setFloat(&quot;Gesture.Swipe.MinVelocity&quot;, 750))
     *        controller.config().save();</code>
     *
     * @author logotype
     *
     */
    export class SwipeGesture extends Gesture {
        /**
         * The type value designating a swipe gesture.
         */
        static classType: number;
        /**
         * The unit direction vector parallel to the swipe motion.
         *
         * <p>You can compare the components of the vector to classify the swipe
         * as appropriate for your application. For example, if you are using
         * swipes for two dimensional scrolling, you can compare the x and y
         * values to determine if the swipe is primarily horizontal or vertical.</p>
         */
        direction: Vector3;
        /**
         * The Finger or Tool performing the swipe gesture.
         */
        pointable: Pointable;
        /**
         * The current swipe position within the Leap frame of reference, in mm.
         */
        position: Vector3;
        /**
         * The speed of the finger performing the swipe gesture in millimeters per second.
         */
        speed: number;
        /**
         * The position where the swipe began.
         */
        startPosition: Vector3;
        /**
         * Constructs a SwipeGesture object from an instance of the Gesture class.
         *
         */
        constructor();
    }
    /**
     * The Vector struct represents a three-component mathematical vector
     * or point such as a direction or position in three-dimensional space.
     *
     * <p>The Leap software employs a right-handed Cartesian coordinate system.
     * Values given are in units of real-world millimeters. The origin is
     * centered at the center of the Leap Motion Controller. The x- and z-axes lie in
     * the horizontal plane, with the x-axis running parallel to the long edge
     * of the device. The y-axis is vertical, with positive values increasing
     * upwards (in contrast to the downward orientation of most computer
     * graphics coordinate systems). The z-axis has positive values increasing
     * away from the computer screen.</p>
     *
     * @author logotype
     *
     */
    export class Vector3 {
        /**
         * The horizontal component.
         */
        x: number;
        /**
         * The vertical component.
         */
        y: number;
        /**
         * The depth component.
         */
        z: number;
        /**
         * Creates a new Vector with the specified component values.
         * @constructor
         * @param x The horizontal component.
         * @param y The vertical component.
         * @param z The depth component.
         *
         */
        constructor(x: number, y: number, z: number);
        /**
         * A copy of this vector pointing in the opposite direction.
         * @return A Vector3 object with all components negated.
         *
         */
        opposite(): Vector3;
        /**
         * Add vectors component-wise.
         * @param other
         * @return
         *
         */
        plus(other: Vector3): Vector3;
        /**
         * Add vectors component-wise and assign the value.
         * @param other
         * @return This Vector3.
         *
         */
        plusAssign(other: Vector3): Vector3;
        /**
         * A copy of this vector pointing in the opposite direction.
         * @param other
         * @return
         *
         */
        minus(other: Vector3): Vector3;
        /**
         * A copy of this vector pointing in the opposite direction and assign the value.
         * @param other
         * @return This Vector3.
         *
         */
        minusAssign(other: Vector3): Vector3;
        /**
         * Multiply vector by a scalar.
         * @param scalar
         * @return
         *
         */
        multiply(scalar: number): Vector3;
        /**
         * Multiply vector by a scalar and assign the quotient.
         * @param scalar
         * @return This Vector3.
         *
         */
        multiplyAssign(scalar: number): Vector3;
        /**
         * Divide vector by a scalar.
         * @param scalar
         * @return
         *
         */
        divide(scalar: number): Vector3;
        /**
         * Divide vector by a scalar and assign the value.
         * @param scalar
         * @return This Vector3.
         *
         */
        divideAssign(scalar: number): Vector3;
        /**
         * Compare Vector equality/inequality component-wise.
         * @param other The Vector3 to compare with.
         * @return True; if equal, False otherwise.
         *
         */
        isEqualTo(other: Vector3): boolean;
        /**
         * The angle between this vector and the specified vector in radians.
         *
         * <p>The angle is measured in the plane formed by the two vectors.
         * The angle returned is always the smaller of the two conjugate angles.
         * Thus <code>A.angleTo(B) === B.angleTo(A)</code> and is always a positive value less
         * than or equal to pi radians (180 degrees).</p>
         *
         * <p>If either vector has zero length, then this returns zero.</p>
         *
         * @param other A Vector object.
         * @return The angle between this vector and the specified vector in radians.
         *
         */
        angleTo(other: Vector3): number;
        /**
         * The cross product of this vector and the specified vector.
         *
         * The cross product is a vector orthogonal to both original vectors.
         * It has a magnitude equal to the area of a parallelogram having the
         * two vectors as sides. The direction of the returned vector is
         * determined by the right-hand rule. Thus <code>A.cross(B) === -B.cross(A)</code>.
         *
         * @param other A Vector object.
         * @return The cross product of this vector and the specified vector.
         *
         */
        cross(other: Vector3): Vector3;
        /**
         * The distance between the point represented by this Vector
         * object and a point represented by the specified Vector object.
         *
         * @param other A Vector object.
         * @return The distance from this point to the specified point.
         *
         */
        distanceTo(other: Vector3): number;
        /**
         * The dot product of this vector with another vector.
         * The dot product is the magnitude of the projection of this vector
         * onto the specified vector.
         *
         * @param other A Vector object.
         * @return The dot product of this vector and the specified vector.
         *
         */
        dot(other: Vector3): number;
        /**
         * Returns true if all of the vector's components are finite.
         * @return If any component is NaN or infinite, then this returns false.
         *
         */
        isValid(): boolean;
        /**
         * Returns an invalid Vector3 object.
         *
         * You can use the instance returned by this in
         * comparisons testing whether a given Vector3 instance
         * is valid or invalid.
         * (You can also use the Vector3.isValid property.)
         *
         * @return The invalid Vector3 instance.
         *
         */
        static invalid(): Vector3;
        /**
         * The magnitude, or length, of this vector.
         * The magnitude is the L2 norm, or Euclidean distance between the
         * origin and the point represented by the (x, y, z) components
         * of this Vector object.
         *
         * @return The length of this vector.
         *
         */
        magnitude(): number;
        /**
         * The square of the magnitude, or length, of this vector.
         * @return The square of the length of this vector.
         *
         */
        magnitudeSquared(): number;
        /**
         * A normalized copy of this vector.
         * A normalized vector has the same direction as the original
         * vector, but with a length of one.
         * @return A Vector object with a length of one, pointing in the same direction as this Vector object.
         *
         */
        normalized(): Vector3;
        /**
         * The pitch angle in radians.
         * Pitch is the angle between the negative z-axis and the projection
         * of the vector onto the y-z plane. In other words, pitch represents
         * rotation around the x-axis. If the vector points upward, the
         * returned angle is between 0 and pi radians (180 degrees); if it
         * points downward, the angle is between 0 and -pi radians.
         *
         * @return The angle of this vector above or below the horizon (x-z plane).
         *
         */
        pitch: number;
        /**
         * The yaw angle in radians.
         * Yaw is the angle between the negative z-axis and the projection
         * of the vector onto the x-z plane. In other words, yaw represents
         * rotation around the y-axis. If the vector points to the right of
         * the negative z-axis, then the returned angle is between 0 and pi
         * radians (180 degrees); if it points to the left, the angle is
         * between 0 and -pi radians.
         *
         * @return The angle of this vector to the right or left of the negative z-axis.
         *
         */
        yaw: number;
        /**
         * The roll angle in radians.
         * Roll is the angle between the y-axis and the projection of the vector
         * onto the x-y plane. In other words, roll represents rotation around
         * the z-axis. If the vector points to the left of the y-axis, then the
         * returned angle is between 0 and pi radians (180 degrees); if it
         * points to the right, the angle is between 0 and -pi radians.
         *
         * Use this to roll angle of the plane to which this vector
         * is a normal. For example, if this vector represents the normal to
         * the palm, then this returns the tilt or roll of the palm
         * plane compared to the horizontal (x-z) plane.
         *
         * @return The angle of this vector to the right or left of the y-axis.
         *
         */
        roll: number;
        /**
         * The zero vector: (0, 0, 0)
         * @return
         *
         */
        static zero(): Vector3;
        /**
         * The x-axis unit vector: (1, 0, 0)
         * @return
         *
         */
        static xAxis(): Vector3;
        /**
         * The y-axis unit vector: (0, 1, 0)
         * @return
         *
         */
        static yAxis(): Vector3;
        /**
         * The z-axis unit vector: (0, 0, 1)
         * @return
         *
         */
        static zAxis(): Vector3;
        /**
         * The unit vector pointing left along the negative x-axis: (-1, 0, 0)
         * @return
         *
         */
        static left(): Vector3;
        /**
         * The unit vector pointing right along the positive x-axis: (1, 0, 0)
         * @return
         *
         */
        static right(): Vector3;
        /**
         * The unit vector pointing down along the negative y-axis: (0, -1, 0)
         * @return
         *
         */
        static down(): Vector3;
        /**
         * The unit vector pointing up along the positive x-axis: (0, 1, 0)
         * @return
         *
         */
        static up(): Vector3;
        /**
         * The unit vector pointing forward along the negative z-axis: (0, 0, -1)
         * @return
         *
         */
        static forward(): Vector3;
        /**
         * The unit vector pointing backward along the positive z-axis: (0, 0, 1)
         * @return
         *
         */
        static backward(): Vector3;
        /**
         * Returns a string containing this vector in a human readable format: (x, y, z).
         * @return
         *
         */
        toString(): string;
    }
}
