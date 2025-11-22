import json
import xml.etree.ElementTree as ET
from xml.dom import minidom

# Read the Supabase table data
with open(r'c:\Users\Ryzen 5 5600G\.cursor\projects\c-jolo-College-4th-year-1st-sem-CAPSTONE-2-wind\agent-tools\a077fbb4-0faf-485e-8590-50fb48ffb5b6.txt', 'r', encoding='utf-8') as f:
    tables = json.load(f)

# Create root element
root = ET.Element('mxfile', host='app.diagrams.net')
diagram = ET.SubElement(root, 'diagram', name='TraviLink Database Schema', id='travilink-db')
model = ET.SubElement(diagram, 'mxGraphModel', 
                     dx='2500', dy='1500', grid='1', gridSize='10', guides='1', 
                     tooltips='1', connect='1', arrows='1', fold='1', page='1', 
                     pageScale='0.5', pageWidth='12000', pageHeight='8000', math='0', shadow='0')
root_elem = ET.SubElement(model, 'root')
mxCell0 = ET.SubElement(root_elem, 'mxCell', id='0')
mxCell1 = ET.SubElement(root_elem, 'mxCell', id='1', parent='0')

# Color scheme for different table types
colors = {
    'users': ('#dae8fc', '#6c8ebf'),
    'departments': ('#d5e8d4', '#82b366'),
    'requests': ('#fff2cc', '#d6b656'),
    'vehicles': ('#f8cecc', '#b85450'),
    'drivers': ('#e1d5e7', '#9673a6'),
    'default': ('#ffe6cc', '#d79b00')
}

def get_table_color(table_name):
    for key, color in colors.items():
        if key in table_name.lower():
            return color
    return colors['default']

def format_data_type(col):
    dt = col.get('data_type', 'text')
    if dt == 'USER-DEFINED':
        enums = col.get('enums', [])
        if enums:
            return f"ENUM: {', '.join(enums)}"
        return dt
    return dt.upper()

def format_column_name(col, pk_list):
    name = col['name']
    dt = format_data_type(col)
    opts = col.get('options', [])
    
    parts = [name, f"({dt})"]
    
    if name in pk_list:
        parts.insert(0, '🔑')
    if 'unique' in opts:
        parts.append('UNIQUE')
    if 'nullable' not in opts:
        parts.append('NOT NULL')
    if 'generated' in opts:
        parts.append('GENERATED')
    
    return ' '.join(parts)

# Layout configuration
cols_per_row = 4
table_width = 300
table_spacing_x = 350
table_spacing_y = 50
start_x = 50
start_y = 50
current_x = start_x
current_y = start_y
row_height = 0

cell_id = 2

# Track table positions and column cell IDs for relationships
table_positions = {}  # {table_name: (x, y, width, height)}
table_column_ids = {}  # {table_name: {column_name: cell_id}}
table_info = {}  # Store table info for later use

for idx, table in enumerate(tables):
    table_name = table['name']
    columns = table['columns']
    pk_list = table.get('primary_keys', [])
    
    # Calculate table height
    num_cols = len(columns)
    table_height = 30 + (num_cols * 26) + 10
    
    # Check if we need a new row
    if idx > 0 and idx % cols_per_row == 0:
        current_y += row_height + table_spacing_y
        current_x = start_x
        row_height = 0
    
    row_height = max(row_height, table_height)
    
    # Get colors
    fill_color, stroke_color = get_table_color(table_name)
    
    # Create table swimlane - use table name as ID for consistency
    table_id = table_name
    table_elem = ET.SubElement(root_elem, 'mxCell', 
                               value=table_name,
                               style=f'swimlane;fontStyle=1;childLayout=stackLayout;horizontal=1;startSize=30;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;marginBottom=0;whiteSpace=wrap;html=1;fillColor={fill_color};strokeColor={stroke_color};',
                               vertex='1',
                               parent='1')
    table_elem.set('id', table_id)
    geom_elem = ET.SubElement(table_elem, 'mxGeometry',
                 x=str(current_x),
                 y=str(current_y),
                 width=str(table_width),
                 height=str(table_height))
    geom_elem.set('as', 'geometry')
    
    # Store table position and info
    table_positions[table_name] = (current_x, current_y, table_width, table_height)
    table_column_ids[table_name] = {}
    table_info[table_name] = table
    
    # Add columns - they should be siblings of the table, not nested inside
    col_y = 30
    for col_idx, col in enumerate(columns):
        col_name = format_column_name(col, pk_list)
        is_pk = col['name'] in pk_list
        col_cell_id = f'{table_name}-{col["name"]}'
        
        style_attr = f'text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;spacingLeft=4;spacingRight=4;overflow=hidden;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;rotatable=0;whiteSpace=wrap;html=1'
        if is_pk:
            style_attr += ';fontStyle=1'
        
        # Column cells are siblings of table cell, added to root_elem
        col_elem = ET.SubElement(root_elem, 'mxCell',
                                id=col_cell_id,
                                value=col_name,
                                style=style_attr,
                                vertex='1',
                                parent=table_id)
        col_geom = ET.SubElement(col_elem, 'mxGeometry',
                     y=str(col_y),
                     width=str(table_width),
                     height='26')
        col_geom.set('as', 'geometry')
        
        # Store column cell ID for relationships
        table_column_ids[table_name][col['name']] = col_cell_id
        col_y += 26
    
    current_x += table_width + table_spacing_x
    cell_id += 1

# Add relationship connections (foreign keys)
edge_id = 10000
for table in tables:
    table_name = table['name']
    fk_constraints = table.get('foreign_key_constraints', [])
    
    for fk in fk_constraints:
        # Parse source: "public.requests.requester_id" -> table: "requests", column: "requester_id"
        source = fk.get('source', '')
        target = fk.get('target', '')
        
        if not source or not target:
            continue
            
        # Extract table and column from source
        source_parts = source.split('.')
        if len(source_parts) < 3:
            continue
        source_table = source_parts[1] if source_parts[0] == 'public' else source_parts[0]
        source_col = source_parts[-1]
        
        # Extract table and column from target
        target_parts = target.split('.')
        if len(target_parts) < 3:
            continue
        target_table = target_parts[1] if target_parts[0] == 'public' else target_parts[0]
        target_col = target_parts[-1]
        
        # Skip if tables don't exist in our diagram
        if source_table not in table_column_ids or target_table not in table_column_ids:
            continue
        
        # Skip if columns don't exist
        if source_col not in table_column_ids[source_table] or target_col not in table_column_ids[target_table]:
            continue
        
        source_cell_id = table_column_ids[source_table][source_col]
        target_cell_id = table_column_ids[target_table][target_col]
        
        # Get table positions for routing
        src_x, src_y, src_w, src_h = table_positions[source_table]
        tgt_x, tgt_y, tgt_w, tgt_h = table_positions[target_table]
        
        # Calculate connection points (right side of source, left side of target)
        src_pt_x = src_x + src_w
        src_pt_y = src_y + 30  # Top of table (header area)
        tgt_pt_x = tgt_x
        tgt_pt_y = tgt_y + 30
        
        # Create edge (connection line)
        edge_elem = ET.SubElement(root_elem, 'mxCell',
                                 id=f'edge-{edge_id}',
                                 value='',
                                 style='edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeWidth=2;strokeColor=#666666;endArrow=ERmany;endFill=0;',
                                 edge='1',
                                 parent='1')
        edge_elem.set('source', source_cell_id)
        edge_elem.set('target', target_cell_id)
        
        # Create geometry for edge with routing points
        edge_geom = ET.SubElement(edge_elem, 'mxGeometry',
                                 relative='1')
        edge_geom.set('as', 'geometry')
        
        # Add routing points for cleaner connections
        mxPoint_elem = ET.SubElement(edge_geom, 'mxPoint',
                                    x=str(src_pt_x),
                                    y=str(src_pt_y))
        mxPoint_elem.set('as', 'sourcePoint')
        
        mxPoint_elem2 = ET.SubElement(edge_geom, 'mxPoint',
                                     x=str(tgt_pt_x),
                                     y=str(tgt_pt_y))
        mxPoint_elem2.set('as', 'targetPoint')
        
        edge_id += 1

# Convert to string and prettify
xml_str = ET.tostring(root, encoding='unicode')
dom = minidom.parseString(xml_str)
pretty_xml = dom.toprettyxml(indent='  ')

# Remove XML declaration (draw.io doesn't need it) - minidom adds it automatically
lines = pretty_xml.split('\n')
if lines[0].startswith('<?xml'):
    pretty_xml = '\n'.join(lines[1:]).lstrip()

# Write to file
with open('TraviLink-Database-Diagram-COMPLETE.drawio', 'w', encoding='utf-8') as f:
    f.write(pretty_xml)

print(f'Generated draw.io file with {len(tables)} tables!')

