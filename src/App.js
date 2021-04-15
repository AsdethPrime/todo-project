import { useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import Dexie from "dexie";
import { AgGridColumn, AgGridReact } from "ag-grid-react";
import "ag-grid-community/dist/styles/ag-grid.css";
import "ag-grid-community/dist/styles/ag-theme-alpine.css";

const db = new Dexie("todoDB");
db.version(1).stores({ todos: "++id" });

function App() {
  // input ref to get typed todo Value
  const todoInputRef = useRef(null);

  // Setting up GridAPI - ag-grid-react 101
  const [gridApi, setGridApi] = useState(null);
  const [columnApi, setColumnApi] = useState(null);
  const onGridReady = (params) => {
    setGridApi(params.api);
    setColumnApi(params.columnApi);
    window.onresize = () => {
      gridApi?.sizeColumnsToFit();
    };
  };

  // Adds Todo to todos collection, and reset the input field
  const addTodo = (event, title) => {
    event.preventDefault();
    if(!title){
      return 
    }
    db.table("todos").add({ title, done: false });
    todoInputRef.current.value = "";
  };

  const allTodos = useLiveQuery(() => db.todos.toArray(), []);

  const toggleSelected = async (e) => {
    const toggleTodo = (id, done) =>
      db.table("todos").update(id, { done: !done });
    const selectedNodes = gridApi.getSelectedNodes();
    const selectedDataList = selectedNodes.map((node) => node.data);
    selectedDataList.forEach((data) => toggleTodo(data.id, data.done));
  };

  const removeSelected = async (e) => {
    const deleteTodo = async (id) => await db.todos.delete(id);
    const selectedNodes = gridApi.getSelectedNodes();
    const selectedIdList = selectedNodes.map((node) => node.data.id);
    selectedIdList.forEach((id) => deleteTodo(id));
  };

  const editTodo = async (e) => {
    await db.todos.update(e.data.id, { title: e.data.title });
  };

  return (
    <div>
      <section className="jumbotron">
        <div className="container">
          <form
            onSubmit={(event) => addTodo(event, todoInputRef.current.value)}
          >
            <div className="form-group">
              <h1 className="text-primary text-center">Todo</h1>
              <input className="form-control" ref={todoInputRef} />
            </div>
          </form>
        </div>
      </section>
      <section className="jumbotron my-4">
        <div className="container">
          <div className="ag-theme-alpine" style={{ height: 600, width: 600 }}>
            <button className="btn btn-danger mx-4" onClick={removeSelected}>
              Remove Selected{" "}
            </button>
            <button
              className="btn btn-info text-white mx-4"
              onClick={toggleSelected}
            >
              Toggle Selected
            </button>
            <AgGridReact
              rowData={allTodos}
              onGridReady={onGridReady}
              rowSelection="multiple"
              unSortIcon={true}
              suppressMenuHide={true}
              defaultColDef={{ editable: true, resizable: true }}
              onCellValueChanged={editTodo}
              resizable={true}
              pagination={true}
            >
              <AgGridColumn
                field="id"
                checkboxSelection={true}
                sortable={true}
              />
              <AgGridColumn field="title" sortable={true} filter={true} />
              <AgGridColumn field="done" sortable={true} filter={true} />
            </AgGridReact>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;
