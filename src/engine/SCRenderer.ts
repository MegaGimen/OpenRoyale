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
        canvas.style.zIndex = '3';
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

    static renderShape(data: any, textures: PIXI.Texture[], shapeId: number, container: PIXI.Container, transformMatrix: PIXI.Matrix, colorTransformId: number | null, blendMode: string | null = null) {
        const shapeData = data.shapes[shapeId];
        if (!shapeData) return;

        let tint = 0xFFFFFF;
        let alpha = 1.0;
        if (colorTransformId !== null && data.colors && data.colors[colorTransformId]) {
            const ct = data.colors[colorTransformId];
            if (ct) {
                const mulR = Math.floor((ct.r_mul ?? 1.0) * 255);
                const mulG = Math.floor((ct.g_mul ?? 1.0) * 255);
                const mulB = Math.floor((ct.b_mul ?? 1.0) * 255);
                tint = (mulR << 16) + (mulG << 8) + mulB;
                alpha = ct.a_mul ?? 1.0;
            }
        }

        if (alpha <= 0.01) return;

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
            mesh.alpha = alpha;
            if (blendMode === 'add' || blendMode === 'multiply' || blendMode === 'screen') {
                try {
                    mesh.blendMode = blendMode as any;
                } catch (e) {
                    // Ignore blend mode errors
                }
            }
            container.addChild(mesh);
        }
    }

    static renderMovieClip(data: any, textures: PIXI.Texture[], clipId: number, parentContainer: PIXI.Container, parentMatrix: PIXI.Matrix, colorTrans: number | null, frameIdx: number, aimAngle: number = -1, bindName: string | null = null, animProgress: number = -1, globalFrameIndex: number = 0, blendMode: string | null = null) {
        const clip = data.movieclips[clipId];
        if (!clip) return;
        
        let actualFrameIdx = frameIdx;
        if (animProgress >= 0) {
            actualFrameIdx = Math.min(Math.floor(animProgress * clip.frames.length), clip.frames.length - 1);
        }
        const frame = clip.frames[actualFrameIdx % clip.frames.length];
        if (!frame || !frame.elements) return;

        for (const el of frame.elements) {
            const bind = clip.binds[el.bind];
            if (!bind) continue;
            
            const childId = bind.id;

            const currentMatrix = new PIXI.Matrix();
            if (el.matrix !== 65535 && data.matrices && data.matrices[el.matrix]) {
                const m = data.matrices[el.matrix];
                currentMatrix.set(m.a, m.b, m.c, m.d, m.tx, m.ty);
            }
            currentMatrix.prepend(parentMatrix);

            const ct = el.color !== 65535 ? el.color : colorTrans;

            const childBlend = bind.blend || blendMode;

            if (data.movieclips[childId]) {
                let childFrameIdx = frameIdx;
                let childAnimProgress = animProgress;
                if (bind.name === 'turret' && aimAngle !== -1) {
                    childFrameIdx = aimAngle;
                    childAnimProgress = -1; // Turret uses absolute frame
                } else if (bind.name === 'king_idle') {
                    childFrameIdx = globalFrameIndex;
                    childAnimProgress = -1; // Idle loops naturally
                }
                this.renderMovieClip(data, textures, childId, parentContainer, currentMatrix, ct, childFrameIdx, aimAngle, bind.name, childAnimProgress, globalFrameIndex, childBlend);
            } else if (data.shapes[childId]) {
                this.renderShape(data, textures, childId, parentContainer, currentMatrix, ct, childBlend);
            }
        }
    }

    static updateEntity(entityId: number, charId: string, action: string, dirSuffix: string, isRed: boolean, frameIndex: number, x: number, y: number, scale: number = 0.55, realAction: string = 'idle', aimAngle: number = -1, overrideFlipX: boolean | null = null, animProgress: number = -1, globalFrameIndex: number = 0) {
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
        
        if (action.includes('Tower') || action.includes('building')) {
            mcId = data.exports[action];
            if (overrideFlipX !== null) flipX = overrideFlipX;
        } else {
            // Directional animations
            if (['1', '4', '9'].includes(dirSuffix)) {
                flipX = true;
            }
            if (overrideFlipX !== null) flipX = overrideFlipX;

            if (flipX) {
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
            this.renderMovieClip(data, textures, mcId, container, containerScale, null, frameIndex, aimAngle, null, animProgress, globalFrameIndex);
        }
        
        // Render princess on tower
        if (action === 'StarTower_base_red' || action === 'StarTower_base_blue') {
            const teamStr = isRed ? '_red' : '';
            // Match the direction logic carefully
            let pDirSuffix = dirSuffix;
            if (['1', '4', '9'].includes(dirSuffix)) {
                if (dirSuffix === '1') pDirSuffix = '3'; 
                if (dirSuffix === '4') pDirSuffix = '6'; 
                if (dirSuffix === '9') pDirSuffix = '7'; 
            }
            
            let pActionName = `princess_tower${teamStr}_${realAction === 'attack' ? 'attack' : 'idle'}1_${pDirSuffix}`;

            const princessData = this.dataCache['chr_princess'];
            const princessTextures = this.texturesCache['chr_princess'];
            if (princessData && princessTextures) {
                const pKeys = Object.keys(princessData.exports);
                if (pKeys.includes(pActionName)) {
                    const pExportId = princessData.exports[pActionName];
                    const princessMatrix = new PIXI.Matrix();
                    
                    if (['1', '4', '9'].includes(dirSuffix)) {
                        princessMatrix.scale(-1, 1);
                    }
                    
                    princessMatrix.translate(0, -30); 
                    princessMatrix.prepend(containerScale);
                    this.renderMovieClip(princessData, princessTextures, pExportId, container, princessMatrix, null, frameIndex, -1, null, animProgress, globalFrameIndex);
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

    static updateEffect(effectId: number, exportName: string, x: number, y: number, scale: number = 0.55, frameIndex: number = 0, fileName: string = 'effects') {
        if (!this.app) return;
        
        const data = this.dataCache[fileName];
        const textures = this.texturesCache[fileName];
        
        // Use a large negative ID to avoid colliding with entity and projectile IDs
        const eid = -effectId - 1000000;
        let container = this.containers.get(eid);
        if (!container) {
            container = new PIXI.Container();
            this.app.stage.addChild(container);
            this.containers.set(eid, container);
        }

        container.position.set(x, y);

        if (!data || !textures) return;

        container.removeChildren().forEach(c => c.destroy({ children: true }));

        const mcId = data.exports[exportName];
        if (mcId !== undefined) {
            const containerScale = new PIXI.Matrix();
            containerScale.scale(scale, scale);
            this.renderMovieClip(data, textures, mcId, container, containerScale, null, frameIndex, -1, null, -1, frameIndex);
        }
    }

    static removeEffect(effectId: number) {
        const eid = -effectId - 1000000;
        const container = this.containers.get(eid);
        if (container) {
            container.destroy({ children: true });
            this.containers.delete(eid);
        }
    }

    // Legacy method for viewer
    static drawFrameDirect(ctx: CanvasRenderingContext2D, charId: string, exportName: string, frameIndex: number, flipX: boolean, scaleMultiplier: number = 0.55) {
        // Not implemented in WebGL version, use updateEntity instead.
    }
}
