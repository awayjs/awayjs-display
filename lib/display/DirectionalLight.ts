import {Matrix3D, Vector3D} from "@awayjs/core";

import {IEntity, TraverserBase} from "@awayjs/graphics";

import {HierarchicalProperties} from "../base/HierarchicalProperties";
import {BoundsType} from "../bounds/BoundsType";
import {DirectionalShadowMapper} from "../shadowmappers/DirectionalShadowMapper";

import {DisplayObject} from "./DisplayObject";
import {LightBase} from "./LightBase";

export class DirectionalLight extends LightBase implements IEntity
{
	public static traverseName:string = TraverserBase.addEntityName("applyDirectionalLight");
	
	public static assetType:string = "[light DirectionalLight]";

	private _direction:Vector3D;
	private _tmpLookAt:Vector3D;
	private _sceneDirection:Vector3D;
	private _pAabbPoints:Array<number> = new Array<number>(24);
	private _projAABBPoints:Array<number>;

	constructor(xDir:number = 0, yDir:number = -1, zDir:number = 1)
	{
		super();

		this._pIsEntity = true;

		this.direction = new Vector3D(xDir, yDir, zDir);

		this._sceneDirection = new Vector3D();

		//default bounds type
		this._boundsType = BoundsType.NULL;
	}

	public get traverseName():string
	{
		return DirectionalLight.traverseName;
	}
	
	public get assetType():string
	{
		return DirectionalLight.assetType;
	}

	public get sceneDirection():Vector3D
	{
		if (this._hierarchicalPropsDirty & HierarchicalProperties.SCENE_TRANSFORM)
			this.pUpdateSceneTransform();

		return this._sceneDirection;
	}

	public get direction():Vector3D
	{
		return this._direction;
	}

	public set direction(value:Vector3D)
	{
		this._direction = value;

		if (!this._tmpLookAt)
			this._tmpLookAt = new Vector3D();

		this._tmpLookAt.x = this.x + this._direction.x;
		this._tmpLookAt.y = this.y + this._direction.y;
		this._tmpLookAt.z = this.z + this._direction.z;

		this.lookAt(this._tmpLookAt);
	}

	//@override
	public pUpdateSceneTransform():void
	{
		super.pUpdateSceneTransform();

		this.sceneTransform.copyColumnTo(2, this._sceneDirection);

		this._sceneDirection.normalize();
	}

	//@override
	public pCreateShadowMapper():DirectionalShadowMapper
	{
		return new DirectionalShadowMapper();
	}

	//override
	public iGetObjectProjectionMatrix(displayObject:DisplayObject, cameraTransform:Matrix3D, target:Matrix3D = null):Matrix3D
	{
		if (!target)
			target = new Matrix3D();
		
		var m:Matrix3D = Matrix3D.CALCULATION_MATRIX;

		m.copyFrom(displayObject.getRenderSceneTransform(cameraTransform));
		m.append(this.inverseSceneTransform);

		if (!this._projAABBPoints)
			this._projAABBPoints = [];

		m.transformVectors(this._pAabbPoints, this._projAABBPoints);

		var xMin:number = Infinity, xMax:number = -Infinity;
		var yMin:number = Infinity, yMax:number = -Infinity;
		var zMin:number = Infinity, zMax:number = -Infinity;
		var d:number;
		for (var i:number = 0; i < 24;) {
			d = this._projAABBPoints[i++];

			if (d < xMin)
				xMin = d;

			if (d > xMax)
				xMax = d;

			d = this._projAABBPoints[i++];

			if (d < yMin)
				yMin = d;

			if (d > yMax)
				yMax = d;

			d = this._projAABBPoints[i++];

			if (d < zMin)
				zMin = d;

			if (d > zMax)
				zMax = d;
		}

		var invXRange:number = 1/(xMax - xMin);
		var invYRange:number = 1/(yMax - yMin);
		var invZRange:number = 1/(zMax - zMin);

		var targetData:Float32Array = target._rawData;

		targetData[0] = 2*invXRange;
		targetData[5] = 2*invYRange;
		targetData[10] = invZRange;
		targetData[12] = -(xMax + xMin)*invXRange;
		targetData[13] = -(yMax + yMin)*invYRange;
		targetData[14] = -zMin*invZRange;
		targetData[1] = targetData[2] = targetData[3] = targetData[4] = targetData[6] = targetData[7] = targetData[8] = targetData[9] = targetData[11] = 0;
		targetData[15] = 1;
		
		target.prepend(m);

		return target;
	}

	/**
	 * //TODO
	 *
	 * @protected
	 */
	public _pUpdateBoxBounds():void
	{
		super._pUpdateBoxBounds();

		//update points
		var minX:number = this._pBoxBounds.x;
		var minY:number = this._pBoxBounds.y - this._pBoxBounds.height;
		var minZ:number = this._pBoxBounds.z;
		var maxX:number = this._pBoxBounds.x + this._pBoxBounds.width;
		var maxY:number = this._pBoxBounds.y;
		var maxZ:number = this._pBoxBounds.z + this._pBoxBounds.depth;

		this._pAabbPoints[0] = minX;
		this._pAabbPoints[1] = minY;
		this._pAabbPoints[2] = minZ;
		this._pAabbPoints[3] = maxX;
		this._pAabbPoints[4] = minY;
		this._pAabbPoints[5] = minZ;
		this._pAabbPoints[6] = minX;
		this._pAabbPoints[7] = maxY;
		this._pAabbPoints[8] = minZ;
		this._pAabbPoints[9] = maxX;
		this._pAabbPoints[10] = maxY;
		this._pAabbPoints[11] = minZ;
		this._pAabbPoints[12] = minX;
		this._pAabbPoints[13] = minY;
		this._pAabbPoints[14] = maxZ;
		this._pAabbPoints[15] = maxX;
		this._pAabbPoints[16] = minY;
		this._pAabbPoints[17] = maxZ;
		this._pAabbPoints[18] = minX;
		this._pAabbPoints[19] = maxY;
		this._pAabbPoints[20] = maxZ;
		this._pAabbPoints[21] = maxX;
		this._pAabbPoints[22] = maxY;
		this._pAabbPoints[23] = maxZ;
	}
}