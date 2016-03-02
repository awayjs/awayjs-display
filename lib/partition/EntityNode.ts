import AssetEvent					= require("awayjs-core/lib/events/AssetEvent");
import Plane3D						= require("awayjs-core/lib/geom/Plane3D");
import Vector3D						= require("awayjs-core/lib/geom/Vector3D");

import DisplayObject				= require("awayjs-display/lib/display/DisplayObject");
import IContainerNode				= require("awayjs-display/lib/partition/IContainerNode");
import ITraverser					= require("awayjs-display/lib/ITraverser");
import IEntity						= require("awayjs-display/lib/display/IEntity");
import DisplayObjectEvent			= require("awayjs-display/lib/events/DisplayObjectEvent");
import PickingCollision				= require("awayjs-display/lib/pick/PickingCollision");
import DisplayObjectNode			= require("awayjs-display/lib/partition/DisplayObjectNode");
import PartitionBase				= require("awayjs-display/lib/partition/PartitionBase");
import IRenderable					= require("awayjs-display/lib/base/IRenderable");
import Sprite						= require("awayjs-display/lib/display/Sprite");
/**
 * @class away.partition.EntityNode
 */
class EntityNode extends DisplayObjectNode
{
	public numEntities:number = 1;

	private _partition:PartitionBase;
	private _maskPosition:Vector3D = new Vector3D();


	constructor(displayObject:DisplayObject, partition:PartitionBase)
	{
		super(displayObject, partition);

		this._partition = partition;
	}

	public onClear(event:AssetEvent)
	{
		super.onClear(event);

		this._partition = null;
	}

	/**
	 *
	 * @param planes
	 * @param numPlanes
	 * @returns {boolean}
	 */
	public isInFrustum(planes:Array<Plane3D>, numPlanes:number):boolean
	{
		if (!this._displayObject._iIsVisible())
			return false;

		return true; // todo: hack for 2d. attention. might break stuff in 3d.
		//return this._bounds.isInFrustum(planes, numPlanes);
	}


	/**
	 * @inheritDoc
	 */
	public isIntersectingRay(globalRayPosition:Vector3D, globalRayDirection:Vector3D):boolean
	{
		if (!this._displayObject._iIsVisible() || !this.isIntersectingMasks(globalRayPosition, globalRayDirection, this._displayObject._iAssignedMasks()))
			return false;

		var pickingCollision:PickingCollision = this._displayObject._iPickingCollision;
		pickingCollision.rayPosition = this._displayObject.inverseSceneTransform.transformVector(globalRayPosition);
		pickingCollision.rayDirection = this._displayObject.inverseSceneTransform.deltaTransformVector(globalRayDirection);

		if (!pickingCollision.normal)
			pickingCollision.normal = new Vector3D();

		var rayEntryDistance:number = this.bounds.rayIntersection(pickingCollision.rayPosition, pickingCollision.rayDirection, pickingCollision.normal);

		if (rayEntryDistance < 0)
			return false;

		pickingCollision.rayEntryDistance = rayEntryDistance;
		pickingCollision.globalRayPosition = globalRayPosition;
		pickingCollision.globalRayDirection = globalRayDirection;
		pickingCollision.rayOriginIsInsideBounds = rayEntryDistance == 0;

		return true;
	}

	/**
	 * @inheritDoc
	 */
	public acceptTraverser(traverser:ITraverser)
	{
		if (traverser.enterNode(this))
			traverser.applyEntity(this._displayObject);
	}

	public _onInvalidatePartitionBounds(event:DisplayObjectEvent)
	{
		this.bounds.invalidate();

		this._partition.iMarkForUpdate(this);
	}

	private isIntersectingMasks(globalRayPosition:Vector3D, globalRayDirection:Vector3D, masks:Array<Array<DisplayObject>>)
	{
		//horrible hack for 2d masks
		if (masks != null) {
			this._maskPosition.x = globalRayPosition.x + globalRayDirection.x*1000;
			this._maskPosition.y = globalRayPosition.y + globalRayDirection.y*1000;
			var numLayers:number = masks.length;
			var children:Array<DisplayObject>;
			var numChildren:number;
			var layerHit:boolean;
			for (var i:number = 0; i < numLayers; i++) {
				children = masks[i];
				numChildren = children.length;
				layerHit = false;
				for (var j:number = 0; j < numChildren; j++) {
					if (children[j].hitTestPoint(this._maskPosition.x, this._maskPosition.y, true, true)) {
						layerHit = true;
						break;
					}
				}

				if (!layerHit)
					return false;
			}
		}

		return true;
	}
}

export = EntityNode;