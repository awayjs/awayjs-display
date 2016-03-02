import DisplayObject				= require("awayjs-display/lib/display/DisplayObject");
import Plane3D						= require("awayjs-core/lib/geom/Plane3D");
import Vector3D						= require("awayjs-core/lib/geom/Vector3D");
import AbstractMethodError			= require("awayjs-core/lib/errors/AbstractMethodError");

import ITraverser					= require("awayjs-display/lib/ITraverser");
import IEntity						= require("awayjs-display/lib/display/IEntity");
import INode						= require("awayjs-display/lib/partition/INode");
import IContainerNode				= require("awayjs-display/lib/partition/IContainerNode");
import BoundingVolumeBase			= require("awayjs-display/lib/bounds/BoundingVolumeBase");
import NullBounds = require("awayjs-display/lib/bounds/NullBounds");

/**
 * @class away.partition.NodeBase
 */
class NodeBase implements IContainerNode
{
	private _bounds:BoundingVolumeBase = new NullBounds();
	public _pChildNodes:Array<INode> = new Array<INode>();
	public _pNumChildNodes:number = 0;

	public _pDebugEntity:IEntity;

	public _iCollectionMark:number;// = 0;

	public numEntities:number = 0;

	public parent:IContainerNode;

	public get debugVisible():boolean
	{
		return false;
	}

	/**
	 * @internal
	 */
	public get bounds():BoundingVolumeBase
	{
		return this._bounds; //TODO
	}


	/**
	 *
	 */
	constructor()
	{
	}

	/**
	 *
	 * @param planes
	 * @param numPlanes
	 * @returns {boolean}
	 * @internal
	 */
	public isInFrustum(planes:Array<Plane3D>, numPlanes:number):boolean
	{
		return true;
	}

	/**
	 *
	 * @param rayPosition
	 * @param rayDirection
	 * @returns {boolean}
	 */
	public isIntersectingRay(rayPosition:Vector3D, rayDirection:Vector3D):boolean
	{
		return true;
	}

	/**
	 *
	 * @returns {boolean}
	 */
	public isCastingShadow():boolean
	{
		return true;
	}

	public dispose()
	{
		this.parent = null;
		this._pChildNodes = null;
	}

	/**
	 *
	 * @param traverser
	 */
	public acceptTraverser(traverser:ITraverser)
	{
		if (this.numEntities == 0)
			return;

		if (traverser.enterNode(this)) {
			for (var i:number = 0; i < this._pNumChildNodes; i++)
				this._pChildNodes[i].acceptTraverser(traverser);
		}
	}

	/**
	 *
	 * @param node
	 * @internal
	 */
	public iAddNode(node:INode)
	{
		node.parent = this;
		this.numEntities += node.numEntities;
		this._pChildNodes[ this._pNumChildNodes++ ] = node;

		var numEntities:number = node.numEntities;
		node = this;

		do {
			node.numEntities += numEntities;
		} while ((node = node.parent) != null);
	}

	/**
	 *
	 * @param node
	 * @internal
	 */
	public iRemoveNode(node:INode)
	{
		var index:number = this._pChildNodes.indexOf(node);
		this._pChildNodes[index] = this._pChildNodes[--this._pNumChildNodes];
		this._pChildNodes.pop();

		var numEntities:number = node.numEntities;
		node = this;

		do {
			node.numEntities -= numEntities;
		} while ((node = node.parent) != null);
	}
}

export = NodeBase;