import { defineStore } from 'pinia'
import { supabase } from '@/utils/supabaseClient'
import { ElMessage, ElMessageBox } from 'element-plus'
import moment from 'moment'
import debounce from 'lodash/debounce';

import { markRaw } from 'vue'
import { Delete } from '@element-plus/icons-vue'

export interface Product {
    id: number,
    name: string,
    description: string,
    price: number,
    createdAt: string,
}

export interface ProductPagination {
    currentPage: number,
    elementsPerPage: number,
    totalElements: number,
}

export const useProductStore = defineStore('product', {
    state: () => ({
        title: '' as String,
        loading: false as Boolean,
        search: '' as String,

        products: [] as Product[],
        productForm: {} as Product,
        productPagination: {
            currentPage: 1,
            elementsPerPage: 10,
            totalElements: 0,
        } as ProductPagination,

        dialog: {
            product: false as Boolean,
        }

    }),
    actions: {
        searchProduct: debounce(function(this: any) {
            this.fetchProducts()
        }, 300),
        
        /* GET PRODUCT WITH SEARCH */
        async fetchProducts() {
            try {
                this.loading = true

                const limit = this.productPagination.elementsPerPage;
                const from = (this.productPagination.currentPage - 1) * limit;
                const to = from + limit - 1;

                let query = supabase
                    .from('Product')
                    .select('*', { count: 'exact' })

                if (this.search && this.search.trim() !== '') {
                    query = query.ilike('name', `%${this.search}%`);
                }

                query = query.order('createdAt', { ascending: false }).range(from, to);

                const { data, error, count } = await query;

                if(error) throw error

                this.products = data.map((data: Product) => ({
                    ...data,
                    createdAt: moment(data.createdAt).format('LLL')
                })) || []
                
                this.productPagination.currentPage = this.productPagination.currentPage;
                this.productPagination.totalElements = count || 0;
            }
            catch(error) {
                console.log(error)
            }
            finally {
                this.loading = false
            }
        },

        /* DELETE PRODUCT */
        async deleteProduct(id: number) {
            try {
                await ElMessageBox.confirm('Do you want to delete this product?', 'Warning', {
                    confirmButtonText: 'OK',
                    cancelButtonText: 'Cancel',
                    type: 'warning',
                    icon: markRaw(Delete),
                })

                this.loading = true

                const { error } = await supabase
                    .from('Product')
                    .delete()
                    .eq('id', id)

                if (error) throw error

                ElMessage.success('Product deleted successfully.')
                this.fetchProducts()

            } catch (error) {
                console.error(error)
            } finally {
                this.loading = false
            }
        },

        /* CREATE / UPDATE FORM */
        async submitForm() {
            try{
                const payload = {
                    name: this.productForm.name,
                    description: this.productForm.description,
                    price: this.productForm.price
                }

                if(this.title === 'Create Product') {
                    const { error } = await supabase
                    .from('Product')
                    .insert(payload) 

                    if(error) throw error

                    ElMessage.success('Product created successfully.')
                }

                if(this.title === 'Edit Product') {
                    const { error } = await supabase
                    .from('Product')
                    .update(payload)
                    .eq('id', this.productForm.id)

                    if(error) throw error

                    ElMessage.success('Product updated successfully.')
                }
            } catch (error) {
                console.error(error)
            } finally {
                this.loading = false
                this.fetchProducts()
                this.dialog.product = false
            }
        },

        /* DIALOG CONTROLLER */
        formController(action: string, product: any) {
            this.title = action
            this.dialog.product = true

            if(action == "Created Product") {}

            if(action == "Edit Product") {
                this.productForm = { ...product }
            }
        },

        /* CLEAR */
        clear() {
            Object.assign(this.productForm, {
                id: undefined,
                name: '',
                description: '',
                price: null,
            })
            this.dialog.product = false
        }
    }
})