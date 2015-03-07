var dg_grid = "var dataGridDesign = {\n\
attributes: { height: '80px', width: '100%'},\n\
columns: [\n\
    { name: 'seq', caption: '#', width: '30px', type: 'lineno' },\n\
    { name: 'name', caption: 'Name', width: '100px', type: 'text' },\n\
    { name: 'check', caption: '', width: '50px', type: 'checkbox', selectall: 1 },\n\
    { name: 'address', caption: 'Address', width: '100px', type: 'select', options: [\n\
        {text: 'Add1', value: 'a1'},\n\
        {text: 'Add2', value: 'a2'},\n\
    ]},\n\
    { name: 'button', caption: 'Button', width: '60px', type: 'button', onclick: 'bClick'},\n\
]};\n\
\n\
var dataGridSource = [\n\
    { name: 'Long', age: 24, date: '1911-10-10', address: 'a1', check: true},\n\
    { name: 'Sam', age: 30, date: '2013-12-10', address: 'a2' },\n\
    { name: 'Lawrence', age: 25, date: '1949-10-01', address: 'a2'}\n\
];\n";

var dg_create = "\n\
var objGrid = new DataGrid('dg1', 'dataGridDiv', dataGridDesign, dataGridSource);";

var dg_getSource = "alert(DataGrid.all['dg2'].getDataSource());";

var dg_reload = "var newSource = [\n\
    { name: 'new Name', address: 'a2'},\n\
];\n\
var dg3 = DataGrid.all['dg3'];\n\
dg3.reload(newSource);";

var dg_addRow = "var dg4 = DataGrid.all['dg4'];\n\
dg4.createNewRow(0);";

var dg_deleteRow = "var dg5 = DataGrid.all['dg5'];\n\
dg5.deleteRow(0);";

var dg_deleteRows = "var dg5 = DataGrid.all['dg5'];\n\
var rows = [1,3];\n\
dg5.deleteRows(rows);";