import * as PIXI from 'pixi.js';
import earcut from 'earcut';

export class SCRenderer {
    static app: PIXI.Application;
    static dataCache: Record<string, any> = {};
    static texturesCache: Record<string, PIXI.Texture[]> = {};
    static containers: Map<number, PIXI.Container> = new Map();

    static async init(containerEl: HTMLElement) {
        if (this.app) return;
        this.app = new PIXI.Application();
        await this.app.init({
            width: containerEl.clientWidth,
            height: containerEl.clientHeight,
            backgroundAlpha: 0,
            antialias: true
        });
        
        const canvas = this.app.canvas as HTMLCanvasElement;
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '0';
        containerEl.insertBefore(canvas, containerEl.firstChild);
    }

    static async loadCharacter(charId: string) {
        if (this.dataCache[charId]) return;
        try {
            const res = await fetch(`/assets/sc/${charId}.json`);
            if (!res.ok) return;
            const data = await res.json();
            this.dataCache[charId] = data;

            const textures: PIXI.Texture[] = [];
            for (const texPath of data.textures) {
                const texture = await PIXI.Assets.load(`/assets/sc/${texPath}`);
                textures.push(texture);
            }
            this.texturesCache[charId] = textures;
        } catch (e) {
            console.error("Failed to load", charId, e);
        }
    }

    static renderShape(data: any, textures: PIXI.Texture[], shapeId: number, container: PIXI.Container, transformMatrix: PIXI.Matrix, colorTransformId: number | null) {
        const shapeData = data.shapes[shapeId];
        if (!shapeData) return;

        let tint = 0xFFFFFF;
        if (colorTransformId !== null && data.color_transforms && data.color_transforms[colorTransformId]) {
            const ct = data.color_transforms[colorTransformId];
            if (ct && ct.length >= 8) {
                const mulR = ct[4], mulG = ct[5], mulB = ct[6];
                tint = (mulR << 16) + (mulG << 8) + mulB;
            }
        }

        const actualTransform = new PIXI.Matrix();
        actualTransform.prepend(transformMatrix);

        for (const part of shapeData) {
            const texIndex = part.texture_index;
            const tex = textures[texIndex];
            if (!tex) continue;

            const vertices: number[] = [];
            const uvs: number[] = [];
            
            for (const pt of part.points) {
                const transformedX = actualTransform.a * pt.x + actualTransform.c * pt.y + actualTransform.tx;
                const transformedY = actualTransform.b * pt.x + actualTransform.d * pt.y + actualTransform.ty;
                
                vertices.push(transformedX, transformedY);
                const uvX = part.is_normalized ? pt.u * tex.width : pt.u;
                const uvY = part.is_normalized ? pt.v * tex.height : pt.v;
                uvs.push(uvX / tex.width, uvY / tex.height);
            }

            const indices = earcut(vertices);
            const geometry = new PIXI.Geometry();
            geometry.addAttribute('aPosition', vertices);
            geometry.addAttribute('aUV', uvs);
            geometry.addIndex(indices);

            const mesh = new PIXI.Mesh({ geometry, texture: tex });
            mesh.tint = tint;
            container.addChild(mesh);
        }
    }

    static renderMovieClip(data: any, textures: PIXI.Texture[], clipId: number, parentContainer: PIXI.Container, parentMatrix: PIXI.Matrix, colorTrans: number | null, frameIdx: number) {
        const clip = data.movieclips[clipId];
        if (!clip) return;
        
        const frame = clip.frames[frameIdx % clip.frames.length];
        if (!frame || !frame.elements) return;

        for (const el of frame.elements) {
            const bind = clip.binds[el.bind];
            if (!bind) continue;
            
            const childId = bind.id;

            const currentMatrix = new PIXI.Matrix();
            if (el.matrix !== 65535 && data.matrices && data.matrices[el.matrix]) {
                const m = data.matrices[el.matrix];
                currentMatrix.set(m[0], m[1], m[2], m[3], m[4], m[5]);
            }
            currentMatrix.prepend(parentMatrix);

            const ct = el.color !== 65535 ? el.color : colorTrans;

            if (data.movieclips[childId]) {
                this.renderMovieClip(data, textures, childId, parentContainer, currentMatrix, ct, frameIdx);
            } else if (data.shapes[childId]) {
                this.renderShape(data, textures, childId, parentContainer, currentMatrix, ct);
            }
        }
    }

    static updateEntity(entityId: number, charId: string, action: string, dirSuffix: string, isRed: boolean, frameIndex: number, x: number, y: number, scale: number = 0.55) {
        if (!this.app) return;
        
        let container = this.containers.get(entityId);
        if (!container) {
            container = new PIXI.Container();
            this.app.stage.addChild(container);
            this.containers.set(entityId, container);
        }

        container.position.set(x, y);

        const data = this.dataCache[charId];
        const textures = this.texturesCache[charId];
        if (!data || !textures) return;

        container.removeChildren().forEach(c => c.destroy({ children: true }));

        let mcId: number | undefined = undefined;
        let suffix = `_${action}1_${dirSuffix}`;
        let flipX = false;

        // Custom mapping for Princess Tower and King Tower static states
        if (action === 'StarTower_base_red' || action === 'StarTower_base_blue' || action === 'KingTower_red' || action === 'KingTower_blue') {
            mcId = data.exports[action];
        } else {
            // Directional animations
            if (['1', '4', '9'].includes(dirSuffix)) {
                flipX = true;
                if (dirSuffix === '1') suffix = `_${action}1_3`; 
                if (dirSuffix === '4') suffix = `_${action}1_6`; 
                if (dirSuffix === '9') suffix = `_${action}1_7`; 
            }

            const keys = Object.keys(data.exports);
            let possibleKeys = keys.filter(k => k.endsWith(suffix));
            
            if (possibleKeys.length === 0 && flipX) {
                possibleKeys = keys.filter(k => k.endsWith(`_${action}1_${dirSuffix}`));
            }

            if (isRed) {
                let redKeys = possibleKeys.filter(k => k.includes('_enemy_') || k.includes('_red_'));
                mcId = redKeys.length > 0 ? data.exports[redKeys[0]] : (possibleKeys.length > 0 ? data.exports[possibleKeys[0]] : undefined);
            } else {
                let blueKeys = possibleKeys.filter(k => !k.includes('_enemy_') && !k.includes('_red_'));
                mcId = blueKeys.length > 0 ? data.exports[blueKeys[0]] : (possibleKeys.length > 0 ? data.exports[possibleKeys[0]] : undefined);
            }
        }

        const scaleX = flipX ? -scale : scale;
        const containerScale = new PIXI.Matrix();
        containerScale.scale(scaleX, scale);
            
        if (mcId !== undefined) {
            this.renderMovieClip(data, textures, mcId, container, containerScale, null, frameIndex);
        }
        
        // Render princess on tower
        if (action === 'StarTower_base_red' || action === 'StarTower_base_blue') {
            const princessAction = `princess_tower_attack1_1`;
            const princessData = this.dataCache['chr_princess'];
            const princessTextures = this.texturesCache['chr_princess'];
            if (princessData && princessTextures) {
                const pExportId = princessData.exports[princessAction];
                if (pExportId) {
                    const princessMatrix = new PIXI.Matrix();
                    princessMatrix.translate(0, -30); 
                    princessMatrix.prepend(containerScale);
                    this.renderMovieClip(princessData, princessTextures, pExportId, container, princessMatrix, null, frameIndex);
                }
            }
        }
    }

    static removeEntity(entityId: number) {
        const container = this.containers.get(entityId);
        if (container) {
            container.destroy({ children: true });
            this.containers.delete(entityId);
        }
    }

    static updateProjectile(projectileId: number, exportName: string, angle: number, x: number, y: number, scale: number = 0.4) {
        if (!this.app) return;
        
        // Use a negative ID to avoid colliding with entity IDs
        const pid = -projectileId;
        let container = this.containers.get(pid);
        if (!container) {
            container = new PIXI.Container();
            this.app.stage.addChild(container);
            this.containers.set(pid, container);
        }

        container.position.set(x, y);
        container.rotation = angle * Math.PI / 180;

        const data = this.dataCache['effects'];
        const textures = this.texturesCache['effects'];
        if (!data || !textures) return;

        container.removeChildren().forEach(c => c.destroy({ children: true }));

        const mcId = data.exports[exportName];
        if (mcId !== undefined) {
            const containerScale = new PIXI.Matrix();
            containerScale.scale(scale, scale);
            this.renderMovieClip(data, textures, mcId, container, containerScale, null, 0);
        }
    }

    static removeProjectile(projectileId: number) {
        const pid = -projectileId;
        const container = this.containers.get(pid);
        if (container) {
            container.destroy({ children: true });
            this.containers.delete(pid);
        }
    }

    // Legacy method for viewer
    static drawFrameDirect(ctx: CanvasRenderingContext2D, charId: string, exportName: string, frameIndex: number, flipX: boolean, scaleMultiplier: number = 0.55) {
        // Not implemented in WebGL version, use updateEntity instead.
    }
}
