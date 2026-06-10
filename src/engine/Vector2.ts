export class Vector2 {
    constructor(public x: number, public y: number) {}

    add(v: Vector2): Vector2 {
        return new Vector2(this.x + v.x, this.y + v.y);
    }

    sub(v: Vector2): Vector2 {
        return new Vector2(this.x - v.x, this.y - v.y);
    }

    mul(scalar: number): Vector2 {
        return new Vector2(this.x * scalar, this.y * scalar);
    }

    div(scalar: number): Vector2 {
        return new Vector2(this.x / scalar, this.y / scalar);
    }

    mag(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize(): Vector2 {
        const m = this.mag();
        if (m === 0) return new Vector2(0, 0);
        return this.div(m);
    }

    distanceTo(v: Vector2): number {
        return this.sub(v).mag();
    }

    distanceSquaredTo(v: Vector2): number {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return dx * dx + dy * dy;
    }

    dot(v: Vector2): number {
        return this.x * v.x + this.y * v.y;
    }

    clone(): Vector2 {
        return new Vector2(this.x, this.y);
    }

    set(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }
}
