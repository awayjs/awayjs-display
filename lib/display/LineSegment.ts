﻿import {Vector3D} from "@awayjs/core";

import {TraverserBase, IRenderable, RenderableEvent, IMaterial} from "@awayjs/renderer";

import {BoundsType} from "../bounds/BoundsType";

import {DisplayObject} from "./DisplayObject";

/**
 * A Line Segment primitive.
 */
export class LineSegment extends DisplayObject implements IRenderable
{
	public static traverseName:string = TraverserBase.addRenderableName("applyLineSegment");

	public static assetType:string = "[asset LineSegment]";

	public _startPosition:Vector3D;
	public _endPosition:Vector3D;
	public _halfThickness:number;
	
	/**
	 *
	 */
	public get assetType():string
	{
		return LineSegment.assetType;
	}

	/**
	 *
	 */
	public get startPostion():Vector3D
	{
		return this._startPosition;
	}

	public set startPosition(value:Vector3D)
	{
		if (this._startPosition == value)
			return;

		this._startPosition = value;

		this.invalidateElements();
	}

	/**
	 *
	 */
	public get endPosition():Vector3D
	{
		return this._endPosition;
	}

	public set endPosition(value:Vector3D)
	{
		if (this._endPosition == value)
			return;

		this._endPosition = value;

		this.invalidateElements();
	}

	/**
	 *
	 */
	public get thickness():number
	{
		return this._halfThickness*2;
	}

	public set thickness(value:number)
	{
		if (this._halfThickness == value)
			return;

		this._halfThickness = value*0.5;

		this.invalidateElements();
	}

	/**
	 * Create a line segment
	 *
	 * @param startPosition Start position of the line segment
	 * @param endPosition Ending position of the line segment
	 * @param thickness Thickness of the line
	 */
	constructor(material:IMaterial, startPosition:Vector3D, endPosition:Vector3D, thickness:number = 1)
	{
		super();

		this._pIsEntity = true;

		this.material = material;

		this._startPosition = startPosition;
		this._endPosition = endPosition;
		this._halfThickness = thickness*0.5;

		//default bounds type
		this._boundsType = BoundsType.AXIS_ALIGNED_BOX;
	}


	/**
	 * @protected
	 */
	public _pUpdateBoxBounds():void
	{
		super._pUpdateBoxBounds();

		this._pBoxBounds.x = Math.min(this._startPosition.x, this._endPosition.x);
		this._pBoxBounds.y = Math.min(this._startPosition.y, this._endPosition.y);
		this._pBoxBounds.z = Math.min(this._startPosition.z, this._endPosition.z);
		this._pBoxBounds.width = Math.abs(this._startPosition.x - this._endPosition.x);
		this._pBoxBounds.height = Math.abs(this._startPosition.y - this._endPosition.y);
		this._pBoxBounds.depth = Math.abs(this._startPosition.z - this._endPosition.z);
	}

	public _pUpdateSphereBounds():void
	{
		super._pUpdateSphereBounds();

		this._pUpdateBoxBounds();

		var halfWidth:number = (this._endPosition.x - this._startPosition.x)/2;
		var halfHeight:number = (this._endPosition.y - this._startPosition.y)/2;
		var halfDepth:number = (this._endPosition.z - this._startPosition.z)/2;
		this._pSphereBounds.x = this._startPosition.x + halfWidth;
		this._pSphereBounds.y = this._startPosition.y + halfHeight;
		this._pSphereBounds.z = this._startPosition.z + halfDepth;
		this._pSphereBounds.radius = Math.sqrt(halfWidth*halfWidth + halfHeight*halfHeight + halfDepth*halfDepth);
	}

	/**
	 * @private
	 */
	public invalidateElements():void
	{
		this.dispatchEvent(new RenderableEvent(RenderableEvent.INVALIDATE_ELEMENTS, this));//TODO improve performance by only using one geometry for all line segments
	}

	public invalidateMaterial():void
	{
		this.dispatchEvent(new RenderableEvent(RenderableEvent.INVALIDATE_MATERIAL, this));
	}

	public _acceptTraverser(traverser:TraverserBase):void
	{
		traverser[LineSegment.traverseName](this);
	}
}

import {AssetEvent} from "@awayjs/core";

import {LineElements} from "@awayjs/graphics";

import {IEntity, _Stage_ElementsBase, _Render_MaterialBase, _Render_RenderableBase, RenderEntity, MaterialUtils, RendererBase} from "@awayjs/renderer";


/**
 * @class away.pool._Render_LineSegment
 */
export class _Render_LineSegment extends _Render_RenderableBase
{
    private static _lineGraphics:Object = new Object();

    /**
     *
     */
    private _lineSegment:LineSegment;

    /**
     * //TODO
     *
     * @param pool
     * @param graphic
     * @param level
     * @param dataOffset
     */
    constructor(lineSegment:LineSegment, renderStatePool:RenderEntity)
    {
        super(lineSegment, renderStatePool);

        this._lineSegment = lineSegment;
    }

    public onClear(event:AssetEvent):void
    {
        super.onClear(event);

        this._lineSegment = null;
    }

    /**
     * //TODO
     *
     * @returns {base.LineElements}
     * @protected
     */
    protected _getStageElements():_Stage_ElementsBase
    {
        var elements:LineElements = _Render_LineSegment._lineGraphics[this._lineSegment.id] || (_Render_LineSegment._lineGraphics[this._lineSegment.id] = new LineElements());

        var start:Vector3D = this._lineSegment.startPostion;
        var end:Vector3D = this._lineSegment.endPosition;

        var positions:Float32Array = new Float32Array(6);
        var thickness:Float32Array = new Float32Array(1);

        positions[0] = start.x;
        positions[1] = start.y;
        positions[2] = start.z;
        positions[3] = end.x;
        positions[4] = end.y;
        positions[5] = end.z;
        thickness[0] = this._lineSegment.thickness;

        elements.setPositions(positions);
        elements.setThickness(thickness);

        return <_Stage_ElementsBase> this._stage.getAbstraction(elements);
    }

    protected _getRenderMaterial():_Render_MaterialBase
    {
        return this._renderGroup.getRenderElements(this.stageElements.elements).getAbstraction(this._lineSegment.material || MaterialUtils.getDefaultColorMaterial());
    }
}

RenderEntity.registerRenderable(_Render_LineSegment, LineSegment);