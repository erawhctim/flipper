// @flow

import {
  ManagedTable,
  Text,
  Heading,
  FlexColumn,
  colors,
  FlexRow,
  ManagedDataInspector,
  styled,
  Select,
  SearchableTable,
  FlipperPlugin,
} from 'flipper';

import type {   
  TableHighlightedRows,
  TableRows,
  TableBodyRow,
} from 'flipper';

type ObjectSchema = {|
  name: string,
  fields: Array<SchemaField>,
|};

type SchemaField = {|
  name: string,
  type: string
|};

type RealmState = {|
  objectSchemas: Array<ObjectSchema>,
  selectedSchema: ?string,
  rows: Array<{ string: any}>,
|};

export default class extends FlipperPlugin<RealmState> {
  static id = "realm-flipper-plugin"

  state = {
    objectSchemas: [],
    selectedSchema: null,
    rows: [],
  };

  reducers = {
    SetObjectSchemas(state: RealmState, results: Object) {
      const newState = results.newState;

      return newState;
    },
  };

  init() {
    this.client
      .call('getRealmObjectSchemas')
      .then((results: Array<ObjectSchema>) => {
        const newState = {
          objectSchemas: results,
          selectedSchema: null,
          rows: []
        }
        this.dispatchAction({newState, type: 'SetObjectSchemas'})
      });
  };

  renderSidebar = () => {
    const showSidebar = this.state.objectSchemas.length != 0;

    const table = <ManagedTable
      virtual={true}
      floating={true}
      multiline={false}
      multiHighlight={false}
      columns={{
        className: {
          value: "Class Name"
        }
      }}
      columnSizes={{
        className: "flex"
      }}
      rows={this.state.objectSchemas.map((schema, index) => {
        return {
          columns: {
            className: {
              value: schema.name
            }
          },

          key: schema.name
        }
      })}
      onRowHighlighted={this.onSidebarRowHighlighted}
    />

    return showSidebar ? table : null;
  };

  renderDataTable = () => {
    const showTable = this.state.selectedSchema != null;

    if (!showTable || this.state.rows.length <= 0) {
      return null;
    }

    const columnNames = Object.keys(this.state.rows[0]);

    const columns = columnNames.reduce(function(obj, columnName) {
      obj[columnName] = {
        "value": columnName
      };
      return obj;
    }, {});

    const columnSizes = columnNames.reduce(function(obj, columnName) {
      obj[columnName] = "flex";
      return obj;
    }, {});

    const rows = this.state.rows.map((row, index) => {
      return {
        columns: columnNames.reduce(function(obj, columnName) {
          obj[columnName] = {
            "value": row[columnName]
          };
          return obj;
        }, {}),

        key: row
      }
    });

    const table = <ManagedTable
      virtual={true}
      floating={true}
      multiline={false}
      multiHighlight={false}
      stickyBottom={true}
      columns={columns}
      columnSizes={columnSizes}
      rows={rows}
      rowLineHeight={26}
      zebra={false}
    />

    return showTable ? table : null;
  };

  onSidebarRowHighlighted = (rows: Array<string>) => {
    const selectedSchema = rows.length === 1 ? rows[0] : null;

    this.setState({
      selectedSchema: selectedSchema,
    });

    if (selectedSchema != null) {
      this.fetchRowData(selectedSchema);
    }
  };

  render() {
    return (
      <FlexRow grow={true} scrollable={true}>
        <FlexColumn>{this.renderSidebar()}</FlexColumn>
        <FlexColumn grow={true}>{this.renderDataTable()}</FlexColumn>
      </FlexRow>
    );
  };

  fetchRowData = (schemaName: string) => {
    // TODO: should probably pass start/end index here if we want to do any sort of pagination
  
    this.setState({
      rows: []
    });

    this.client
      .call('getRowData', { schemaName: schemaName })
      .then((results: Array<mixed>) => {
        if (results.length <= 0) {
          return;
        }
  
        const count = results.length;

        this.setState({
          rows: results
        });
      });
  };
}