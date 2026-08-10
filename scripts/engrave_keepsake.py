"""Parametric keepsake engraving for Nyzora fulfillment.

Cuts REAL recessed geometry (name / date) into a keepsake mesh so the
FDM partner prints readable text. Run per order before submitting the file.

Usage:
  python scripts/engrave_keepsake.py IN.stl OUT.stl "Luna" "2019 - 2025"

FDM rules: 1.0 mm recess depth, >=7 mm cap height, bold sans face, text on the
flat front face of the plinth. Non-watertight inputs are voxel-repaired (0.4 mm).
"""
import trimesh, numpy as np, sys
from matplotlib.textpath import TextPath
from matplotlib.font_manager import FontProperties
from shapely.geometry import Polygon
from shapely.ops import unary_union

def text_polys(text, size, font=None):
    fp = FontProperties(family='DejaVu Sans', weight='bold')
    tp = TextPath((0,0), text, size=size, prop=fp)
    polys=[]
    for poly in tp.to_polygons():
        if len(poly)>2:
            p=Polygon(poly)
            if p.is_valid and p.area>0: polys.append(p)
    # even-odd: subtract holes
    polys.sort(key=lambda p:-p.area)
    result=None
    for p in polys:
        result = p if result is None else (result.difference(p) if result.contains(p) else result.union(p))
    return result

def engrave(mesh_path, out_path, lines, depth=0.8, cap_h=8.0, line_gap=4.0, z_center=24.0):
    m = trimesh.load(mesh_path)
    trimesh.repair.fill_holes(m); m.merge_vertices()
    xmin,ymin,zmin = m.bounds[0]; xmax,ymax,zmax = m.bounds[1]
    cutters=[]
    total_h = len(lines)*cap_h + (len(lines)-1)*line_gap
    top = z_center + total_h/2
    for i,(txt,scale) in enumerate(lines):
        h = cap_h*scale
        g = text_polys(txt.upper(), h)
        geoms = list(g.geoms) if g.geom_type=='MultiPolygon' else [g]
        cut = trimesh.util.concatenate([trimesh.creation.extrude_polygon(p, depth*2) for p in geoms])
        # orient: text XY -> world XZ, extrude along +Y into the front face (y=ymin)
        cut.apply_transform(trimesh.transformations.rotation_matrix(np.pi/2, [1,0,0]))
        b=cut.bounds
        cx=(b[0][0]+b[1][0])/2; cz=(b[0][2]+b[1][2])/2
        z = top - sum(cap_h*s for _,s in lines[:i]) - line_gap*i - h/2
        cut.apply_translation([ (xmin+xmax)/2 - cx, ymin + depth - b[1][1], z - cz ])
        cutters.append(cut)
    cutter = trimesh.util.concatenate(cutters)
    res = trimesh.boolean.difference([m, cutter], engine='manifold', check_volume=False)
    res.export(out_path)
    print(out_path, res.bounds.round(2).tolist(), 'watertight', res.is_watertight, 'vol_cm3', round(res.volume/1000,1))



def repair_to_solid(path, pitch=0.4):
    m = trimesh.load(path)
    m.merge_vertices()
    if m.is_watertight:
        return m
    solid = m.voxelized(pitch=pitch).fill().marching_cubes
    solid.apply_scale(pitch)
    return solid


if __name__ == '__main__':
    src, dst = sys.argv[1], sys.argv[2]
    name = sys.argv[3] if len(sys.argv) > 3 else ''
    date = sys.argv[4] if len(sys.argv) > 4 else ''
    lines = [(name, 1.4)] + ([(date, 0.8)] if date else [])
    solid = repair_to_solid(src)
    tmp = '/tmp/_keepsake_solid.stl'
    solid.export(tmp)
    engrave(tmp, dst, lines, depth=1.0, cap_h=9.0, line_gap=5.0, z_center=22.0)
