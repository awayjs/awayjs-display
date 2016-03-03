import Box							= require("awayjs-core/lib/geom/Box");
import Point						= require("awayjs-core/lib/geom/Point");
import Vector3D						= require("awayjs-core/lib/geom/Vector3D");

import ITraverser					= require("awayjs-display/lib/ITraverser");
import IAnimator					= require("awayjs-display/lib/animators/IAnimator");
import DisplayObject				= require("awayjs-display/lib/display/DisplayObject");
import Graphics						= require("awayjs-display/lib/graphics/Graphics");
import ElementsBase					= require("awayjs-display/lib/graphics/ElementsBase");
import GraphicsEvent				= require("awayjs-display/lib/events/GraphicsEvent");
import DisplayObjectContainer		= require("awayjs-display/lib/display/DisplayObjectContainer");
import MaterialBase					= require("awayjs-display/lib/materials/MaterialBase");
import TextureBase					= require("awayjs-display/lib/textures/TextureBase");
import ElementsUtils				= require("awayjs-display/lib/utils/ElementsUtils");
import Style						= require("awayjs-display/lib/base/Style");
import StyleEvent					= require("awayjs-display/lib/events/StyleEvent");

/**
 * This class is used to create lightweight shapes using the ActionScript
 * drawing application program interface(API). The Shape class includes a
 * <code>graphics</code> property, which lets you access methods from the
 * Graphics class.
 *
 * <p>The Shape class also includes a <code>graphics</code>property, and it
 * includes other features not available to the Shape class. For example, a
 * Shape object is a display object container, whereas a Shape object is not
 * (and cannot contain child display objects). For this reason, Shape objects
 * consume less memory than Shape objects that contain the same graphics.
 * However, a Shape object supports user input events, while a Shape object
 * does not.</p>
 */
class Shape extends DisplayObject
{
	private static _shapes:Array<Shape> = new Array<Shape>();

	public static assetType:string = "[asset Shape]";

	private _center:Vector3D;
	private _graphics:Graphics;
	private _onGraphicsBoundsInvalidDelegate:(event:GraphicsEvent) => void;

	//temp point used in hit testing
	private _tempPoint:Point = new Point();

	/**
	 *
	 */
	public get assetType():string
	{
		return Shape.assetType;
	}

	/**
	 * Specifies the Graphics object belonging to this Shape object, where
	 * drawing commands can occur.
	 */
	public get graphics():Graphics
	{
		if (this._iSourcePrefab)
			this._iSourcePrefab._iValidate();

		return this._graphics;
	}

	/**
	 * Defines the animator of the graphics object.  Default value is <code>null</code>.
	 */
	public get animator():IAnimator
	{
		return this._graphics.animator;
	}

	public set animator(value:IAnimator)
	{
		if (this._graphics.animator)
			this._graphics.animator.removeOwner(this);

		this._graphics.animator = value;

		if (this._graphics.animator)
			this._graphics.animator.addOwner(this);
	}

	/**
	 * The material with which to render the Shape.
	 */
	public get material():MaterialBase
	{
		return this._graphics.material;
	}

	public set material(value:MaterialBase)
	{
		this._graphics.material = value;
	}

	/**
	 *
	 */
	public get style():Style
	{
		return this._graphics.style;
	}

	public set style(value:Style)
	{
		this._graphics.style = value;
	}

	/**
	 * Create a new Shape object.
	 *
	 * @param material    [optional]        The material with which to render the Shape.
	 */
	constructor(material:MaterialBase = null)
	{
		super();

		this._pIsEntity = true;

		this._onGraphicsBoundsInvalidDelegate = (event:GraphicsEvent) => this.onGraphicsBoundsInvalid(event);

		this._graphics = new Graphics(); //unique graphics object for each Shape
		this._graphics.addEventListener(GraphicsEvent.BOUNDS_INVALID, this._onGraphicsBoundsInvalidDelegate);

		this.material = material;
	}

	/**
	 *
	 */
	public bakeTransformations()
	{
		this._graphics.applyTransformation(this.transform.matrix3D);
		this.transform.clearMatrix3D();
	}

	/**
	 * @inheritDoc
	 */
	public dispose()
	{
		this.disposeValues();

		Shape._shapes.push(this);
	}

	/**
	 * @inheritDoc
	 */
	public disposeValues()
	{
		super.disposeValues();

		this._graphics.dispose();
	}

	/**
	 * Clones this Shape instance along with all it's children, while re-using the same
	 * material, graphics and animation set. The returned result will be a copy of this shape,
	 * containing copies of all of it's children.
	 *
	 * Properties that are re-used (i.e. not cloned) by the new copy include name,
	 * graphics, and material. Properties that are cloned or created anew for the copy
	 * include subShapees, children of the shape, and the animator.
	 *
	 * If you want to copy just the shape, reusing it's graphics and material while not
	 * cloning it's children, the simplest way is to create a new shape manually:
	 *
	 * <code>
	 * var clone : Shape = new Shape(original.graphics, original.material);
	 * </code>
	 */
	public clone():Shape
	{
		var newInstance:Shape = (Shape._shapes.length)? Shape._shapes.pop() : new Shape();

		this.copyTo(newInstance);

		return newInstance;
	}

	public copyTo(shape:Shape)
	{
		super.copyTo(shape);

		this._graphics.copyTo(shape.graphics);
	}

	/**
	 * //TODO
	 *
	 * @protected
	 */
	public _pUpdateBoxBounds()
	{
		super._pUpdateBoxBounds();

		this._pBoxBounds.union(this._graphics.getBoxBounds(), this._pBoxBounds);
	}


	public _pUpdateSphereBounds()
	{
		super._pUpdateSphereBounds();

		var box:Box = this.getBox();

		if (!this._center)
			this._center = new Vector3D();

		this._center.x = box.x + box.width/2;
		this._center.y = box.y + box.height/2;
		this._center.z = box.z + box.depth/2;

		this._pSphereBounds = this._graphics.getSphereBounds(this._center, this._pSphereBounds);
	}

	/**
	 * //TODO
	 *
	 * @private
	 */
	private onGraphicsBoundsInvalid(event:GraphicsEvent)
	{
		this._pInvalidateBounds();
	}

	/**
	 *
	 * @param renderer
	 *
	 * @internal
	 */
	public _acceptTraverser(traverser:ITraverser)
	{
		this.graphics.acceptTraverser(traverser);
	}

	public _hitTestPointInternal(x:number, y:number, shapeFlag:boolean, masksFlag:boolean):boolean
	{
		if(this._graphics.count) {
			this._tempPoint.setTo(x,y);
			var local:Point = this.globalToLocal(this._tempPoint, this._tempPoint);
			var box:Box;

			//early out for box test
			if(!(box = this.getBox()).contains(local.x, local.y, 0))
				return false;

			//early out for non-shape tests
			if (!shapeFlag)
				return true;

			//ok do the graphics thing
			if (this._graphics._hitTestPointInternal(local.x, local.y))
				return true;
		}

		return false;
	}

	public clear()
	{
		super.clear();

		this._graphics.clear();
	}
}

export = Shape;