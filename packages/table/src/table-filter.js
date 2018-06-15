import LayoutObserver from './layout-observer';
import ElInput from 'element-ui/packages/input';
import ElCheckbox from 'element-ui/packages/checkbox';
import ElCheckboxGroup from 'element-ui/packages/checkbox-group';
import ElDatePicker from 'element-ui/packages/date-picker';
import ElTooltip from 'element-ui/packages/tooltip';
import ElPopover from 'element-ui/packages/popover';
import { modifyWithDefaultTime } from 'element-ui/packages/date-picker/src/util';

export default {
  name: 'ElTableFilter',

  mixins: [LayoutObserver],

  render(h) {
    const sums = [];
    let _self = this;
    const filterMain = function(column, cellIndex) {
      if(column.type == 'selection'){
        return '';
      }
      if(column.type == 'index'){
        return '筛选';
      }
      if(column.tmsFilterType == 'checkbox'){
        return (
          <section style="display: block;">
            <el-popover
              ref={"popover" + cellIndex}
              placement="bottom-end"
              trigger="focus">
              <section class="tms-popover-main">
                {
                  _self._l(column.tmsFilterCheckBox, checkedObj =>
                    <el-checkbox 
                      class="filter-checkbox"
                      key={checkedObj.value}
                      label={checkedObj.value}
                      on-change={(val) => _self.checkboxChange(val, checkedObj, cellIndex)}>
                      { checkedObj.name }
                    </el-checkbox>
                  )
                }
              </section>
              <el-input 
                slot="reference"
                value={_self.tmsFilterCheckBoxShow[cellIndex]}>
              </el-input>
            </el-popover>
          </section>
        );
      }else if(column.tmsFilterType == 'date'){
        return (
          <el-date-picker 
            value={_self.tmsFilterValued[cellIndex]} 
            type="daterange" 
            format="yyyy-MM-dd"
            size="mini"
            on-input={(val) => _self.dateInput(val, cellIndex)} >
          </el-date-picker>
        );
      }else{
        return (
          <el-input 
            value={_self.tmsFilterValued[cellIndex]}
            nativeOn-keyup={(event) => _self.inputChange(event, cellIndex)}>
          </el-input>
        );
      }
    };

    return (
      <table
        class="el-table__header el-table__filter"
        cellspacing="0"
        cellpadding="0"
        border="0">
        <colgroup>
          {
            this._l(this.columns, column => <col name={ column.id } />)
          }
          {
            this.hasGutter ? <col name="gutter" /> : ''
          }
        </colgroup>
        <thead class={ [{ 'has-gutter': this.hasGutter }] }>
          <tr class="tr-filter">
            {
              this._l(this.columns, (column, cellIndex) =>
                <th
                  colspan={ column.colSpan }
                  rowspan={ column.rowSpan }
                  class={ [column.id, column.headerAlign, column.className || '', this.isCellHidden(cellIndex, this.columns) ? 'is-hidden' : '', !column.children ? 'is-leaf' : '', column.labelClassName] }>
                  <div class={ ['cell', column.labelClassName] }>
                    {
                      filterMain(column, cellIndex)
                    }
                  </div>
                </th>
              )
            }
            {
              this.hasGutter ? <th class="gutter"></th> : ''
            }
          </tr>
        </thead>
      </table>
    );
  },

  data(){
    return {
      tmsFilterValued: {},
      tmsFilterCheckBoxShow: {},
      isCheckboxShow: {},
    }
  },

  props: {
    fixed: String,
    store: {
      required: true
    },
    border: Boolean,
    defaultSort: {
      type: Object,
      default() {
        return {
          prop: '',
          order: ''
        };
      }
    }
  },

  components: {
    ElInput,
    ElCheckbox,
    ElCheckboxGroup,
    ElDatePicker,
    ElTooltip,
    ElPopover,
  },

  computed: {
    table() {
      return this.$parent;
    },

    isAllSelected() {
      return this.store.states.isAllSelected;
    },

    columnsCount() {
      return this.store.states.columns.length;
    },

    leftFixedCount() {
      return this.store.states.fixedColumns.length;
    },

    rightFixedCount() {
      return this.store.states.rightFixedColumns.length;
    },

    columns() {
      return this.store.states.columns;
    },

    hasGutter() {
      return !this.fixed && this.tableLayout.gutterWidth;
    }
  },

  methods: {
    closeCheckbox(){
      for(let key in this.isCheckboxShow){
        this.$set(this.isCheckboxShow, key, false)
      }
    },
    dateInput(value, cellIndex){
      if(value && Array.isArray(value) && value.length == 2){
        value[0] = modifyWithDefaultTime((new Date(value[0])), '00:00:00').getTime();
        value[1] = modifyWithDefaultTime((new Date(value[1])), '23:59:59').getTime();
      }else{
        value = [];
      }
      this.$set(this.tmsFilterValued, cellIndex, value);
      this.closeCheckbox();
      this.$nextTick(() => {
        this.confirmFilter(cellIndex)
      });
    },
    checkboxChange(val, obj, cellIndex){
      if(val){
        if(this.tmsFilterValued[cellIndex]){
          this.tmsFilterValued[cellIndex].push(obj);
        }else{
          this.tmsFilterValued[cellIndex] = [obj];
        }
      }else{
        this.tmsFilterValued[cellIndex] = this.tmsFilterValued[cellIndex].filter(cObj => {
          return cObj.value != obj.value;
        });
      }
      let checkboxValue = Object.assign([], this.tmsFilterValued[cellIndex]);
      this.$nextTick(() => {
        let checkboxShow = '';
        for(let i=0; i<checkboxValue.length; i++){
          let cDemo = checkboxValue[i];
          checkboxShow += cDemo.name + ',';
        }
        checkboxShow = checkboxShow.substring(0, checkboxShow.length - 1);
        this.$set(this.tmsFilterCheckBoxShow, cellIndex, checkboxShow);
        this.confirmFilter(cellIndex)
      });
    },
    inputChange(event, cellIndex){
      this.tmsFilterValued[cellIndex] = event.target.value;
      this.closeCheckbox();
      this.$nextTick(() => {
        this.confirmFilter(cellIndex)
      });
    },
    confirmFilter(cellIndex) {
      this.table.store.commit('tmsFilterChange', {
        column: this.columns[cellIndex],
        values: this.tmsFilterValued[cellIndex]
      });
      this.table.store.updateAllSelected();
    },
    isCellHidden(index, columns) {
      if (this.fixed === true || this.fixed === 'left') {
        return index >= this.leftFixedCount;
      } else if (this.fixed === 'right') {
        let before = 0;
        for (let i = 0; i < index; i++) {
          before += columns[i].colSpan;
        }
        return before < this.columnsCount - this.rightFixedCount;
      } else {
        return (index < this.leftFixedCount) || (index >= this.columnsCount - this.rightFixedCount);
      }
    }
  }
};
