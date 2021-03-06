import { IMaterial, ElementsType, ElementsBase, TriangleElements, LineElements } from '@awayjs/renderer';

import { PrimitivePrefabBase } from '../prefabs/PrimitivePrefabBase';

/**
 * A UV Sphere primitive sprite.
 */
export class PrimitiveSpherePrefab extends PrimitivePrefabBase {
	private _radius: number;
	private _segmentsW: number;
	private _segmentsH: number;
	private _yUp: boolean;

	/**
	 * The radius of the sphere.
	 */
	public get radius(): number {
		return this._radius;
	}

	public set radius(value: number) {
		this._radius = value;

		this._pInvalidatePrimitive();
	}

	/**
	 * Defines the number of horizontal segments that make up the sphere. Defaults to 16.
	 */
	public get segmentsW(): number {
		return this._segmentsW;
	}

	public set segmentsW(value: number) {
		this._segmentsW = value;

		this._pInvalidatePrimitive();
		this._pInvalidateUVs();
	}

	/**
	 * Defines the number of vertical segments that make up the sphere. Defaults to 12.
	 */
	public get segmentsH(): number {
		return this._segmentsH;
	}

	public set segmentsH(value: number) {
		this._segmentsH = value;

		this._pInvalidatePrimitive();
		this._pInvalidateUVs();
	}

	/**
	 * Defines whether the sphere poles should lay on the Y-axis (true) or on the Z-axis (false).
	 */
	public get yUp(): boolean {
		return this._yUp;
	}

	public set yUp(value: boolean) {
		this._yUp = value;

		this._pInvalidatePrimitive();
	}

	/**
	 * Creates a new Sphere object.
	 *
	 * @param radius The radius of the sphere.
	 * @param segmentsW Defines the number of horizontal segments that make up the sphere.
	 * @param segmentsH Defines the number of vertical segments that make up the sphere.
	 * @param yUp Defines whether the sphere poles should lay on the Y-axis (true) or on the Z-axis (false).
	 */
	constructor(material: IMaterial = null, elementsType: string = 'triangle',
		radius: number = 50, segmentsW: number = 16,
		segmentsH: number = 12, yUp: boolean = true) {
		super(material, elementsType);

		this._radius = radius;
		this._segmentsW = segmentsW;
		this._segmentsH = segmentsH;
		this._yUp = yUp;
	}

	/**
	 * @inheritDoc
	 */
	public _pBuildGraphics(target: ElementsBase, elementsType: string): void {
		let indices: Uint16Array;
		let positions: ArrayBufferView;
		let normals: Float32Array;
		let tangents: Float32Array;
		let stride: number;

		let i: number;
		let j: number;
		let vidx: number, fidx: number; // indices

		let comp1: number;
		let comp2: number;
		let numVertices: number;

		if (elementsType == ElementsType.TRIANGLE) {

			const triangleGraphics: TriangleElements = <TriangleElements> target;

			numVertices = (this._segmentsH + 1) * (this._segmentsW + 1);

			if (numVertices == triangleGraphics.numVertices && triangleGraphics.indices != null) {
				triangleGraphics.invalidateIndices();
				triangleGraphics.invalidateVertices(triangleGraphics.positions);
				triangleGraphics.invalidateVertices(triangleGraphics.normals);
				triangleGraphics.invalidateVertices(triangleGraphics.tangents);
			} else {
				triangleGraphics.setIndices(new Uint16Array((this._segmentsH - 1) * this._segmentsW * 6));
				triangleGraphics.setPositions(new Float32Array(numVertices * 3));
				triangleGraphics.setNormals(new Float32Array(numVertices * 3));
				triangleGraphics.setTangents(new Float32Array(numVertices * 3));
				this._pInvalidateUVs();
			}

			indices = triangleGraphics.indices.get(triangleGraphics.numElements);
			positions = triangleGraphics.positions.get(numVertices);
			normals = triangleGraphics.normals.get(numVertices);
			tangents = triangleGraphics.tangents.get(numVertices);
			stride = triangleGraphics.concatenatedBuffer.stride / 4;

			vidx = 0;
			fidx = 0;

			let startIndex: number;
			let t1: number;
			let t2: number;

			for (j = 0; j <= this._segmentsH; ++j) {

				startIndex = vidx;

				const horangle: number = Math.PI * j / this._segmentsH;
				const z: number = -this._radius * Math.cos(horangle);
				const ringradius: number = this._radius * Math.sin(horangle);

				for (i = 0; i <= this._segmentsW; ++i) {
					const verangle: number = 2 * Math.PI * i / this._segmentsW;
					const x: number = ringradius * Math.cos(verangle);
					const y: number = ringradius * Math.sin(verangle);
					const normLen: number = 1 / Math.sqrt(x * x + y * y + z * z);
					const tanLen: number = Math.sqrt(y * y + x * x);

					if (this._yUp) {

						t1 = 0;
						t2 = tanLen > .007 ? x / tanLen : 0;
						comp1 = -z;
						comp2 = y;

					} else {
						t1 = tanLen > .007 ? x / tanLen : 0;
						t2 = 0;
						comp1 = y;
						comp2 = z;
					}

					if (i == this._segmentsW) {
						positions[vidx] = positions[startIndex];
						positions[vidx + 1] = positions[startIndex + 1];
						positions[vidx + 2] = positions[startIndex + 2];
						normals[vidx] = normals[startIndex] + (x * normLen) * .5;
						normals[vidx + 1] = normals[startIndex + 1] + (comp1 * normLen) * .5;
						normals[vidx + 2] = normals[startIndex + 2] + (comp2 * normLen) * .5;
						tangents[vidx] = tanLen > .007 ? -y / tanLen : 1;
						tangents[vidx + 1] = t1;
						tangents[vidx + 2] = t2;

					} else {

						positions[vidx] = x;
						positions[vidx + 1] = comp1;
						positions[vidx + 2] = comp2;
						normals[vidx] = x * normLen;
						normals[vidx + 1] = comp1 * normLen;
						normals[vidx + 2] = comp2 * normLen;
						tangents[vidx] = tanLen > .007 ? -y / tanLen : 1;
						tangents[vidx + 1] = t1;
						tangents[vidx + 2] = t2;
					}

					if (i > 0 && j > 0) {

						const a: number = (this._segmentsW + 1) * j + i;
						const b: number = (this._segmentsW + 1) * j + i - 1;
						const c: number = (this._segmentsW + 1) * (j - 1) + i - 1;
						const d: number = (this._segmentsW + 1) * (j - 1) + i;

						if (j == this._segmentsH) {

							positions[vidx] = positions[startIndex];
							positions[vidx + 1] = positions[startIndex + 1];
							positions[vidx + 2] = positions[startIndex + 2];

							indices[fidx++] = a;
							indices[fidx++] = c;
							indices[fidx++] = d;

						} else if (j == 1) {

							indices[fidx++] = a;
							indices[fidx++] = b;
							indices[fidx++] = c;

						} else {
							indices[fidx++] = a;
							indices[fidx++] = b;
							indices[fidx++] = c;
							indices[fidx++] = a;
							indices[fidx++] = c;
							indices[fidx++] = d;
						}
					}

					vidx += stride;
				}
			}

		} else if (elementsType == ElementsType.LINE) {

			const lineGraphics: LineElements = <LineElements> target;

			const numSegments: number = this._segmentsH * this._segmentsW * 2 + this._segmentsW;
			const positions: ArrayBufferView = new Float32Array(numSegments * 6);
			const thickness: Float32Array = new Float32Array(numSegments);

			vidx = 0;

			fidx = 0;

			for (j = 0; j <= this._segmentsH; ++j) {

				const horangle: number = Math.PI * j / this._segmentsH;
				const z: number = -this._radius * Math.cos(horangle);
				const ringradius: number = this._radius * Math.sin(horangle);

				for (i = 0; i <= this._segmentsW; ++i) {
					const verangle: number = 2 * Math.PI * i / this._segmentsW;
					const x: number = ringradius * Math.cos(verangle);
					const y: number = ringradius * Math.sin(verangle);

					if (this._yUp) {
						comp1 = -z;
						comp2 = y;

					} else {
						comp1 = y;
						comp2 = z;
					}

					if (i > 0) {
						//horizonal lines
						positions[vidx++] = x;
						positions[vidx++] = comp1;
						positions[vidx++] = comp2;

						thickness[fidx++] = 1;

						//vertical lines
						if (j > 0) {
							const addx: number =
								(j == 1) ? 3 - (6 * (this._segmentsW - i) + 12 * i) : 3 - this._segmentsW * 12;
							positions[vidx] = positions[vidx++ + addx];
							positions[vidx] = positions[vidx++ + addx];
							positions[vidx] = positions[vidx++ + addx];

							positions[vidx++] = x;
							positions[vidx++] = comp1;
							positions[vidx++] = comp2;

							thickness[fidx++] = 1;
						}

					}

					//horizonal lines
					if (i < this._segmentsW) {
						positions[vidx++] = x;
						positions[vidx++] = comp1;
						positions[vidx++] = comp2;
					}
				}
			}

			// build real data from raw data
			lineGraphics.setPositions(positions);
			lineGraphics.setThickness(thickness);
		}
	}

	/**
	 * @inheritDoc
	 */
	public _pBuildUVs(target: ElementsBase, elementsType: string): void {
		let i: number, j: number;
		let numVertices: number = (this._segmentsH + 1) * (this._segmentsW + 1);
		let uvs: ArrayBufferView;
		let stride: number;

		if (elementsType == ElementsType.TRIANGLE) {

			numVertices = (this._segmentsH + 1) * (this._segmentsW + 1);

			const triangleGraphics: TriangleElements = <TriangleElements> target;

			if (triangleGraphics.uvs && numVertices == triangleGraphics.numVertices) {
				triangleGraphics.invalidateVertices(triangleGraphics.uvs);
			} else {
				triangleGraphics.setUVs(new Float32Array(numVertices * 2));
			}

			uvs = triangleGraphics.uvs.get(numVertices);
			stride = triangleGraphics.uvs.stride;

			let index: number = 0;
			for (j = 0; j <= this._segmentsH; ++j) {
				for (i = 0; i <= this._segmentsW; ++i) {
					uvs[index] = (i / this._segmentsW) * this._scaleU;
					uvs[index + 1] = (j / this._segmentsH) * this._scaleV;

					index += stride;
				}
			}

		} else if (elementsType == ElementsType.LINE) {
			//nothing to do here
		}
	}
}