import {Product as IProduct} from "../../src/common/types";
import React from "react";
import {CartApi, ExampleApi} from "../../src/client/api";
import {initStore} from "../../src/client/store";
import {fireEvent, getAllByTestId, render, waitFor} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import {Provider} from "react-redux";
import axios from "axios";
import {Application} from "../../src/client/Application";

const basename = '/hw/store';
const api = new ExampleApi(basename);

const renderWithApp = (location = '', preloadStore = new CartApi()) => {
    const store = initStore(api, preloadStore);
    return render(
        <MemoryRouter
            initialEntries={[basename + location]}
            initialIndex={0}
            basename={basename}
        >
            <Provider store={store}>
                <Application/>
            </Provider>
        </MemoryRouter>
    )
}

const productsDetail: IProduct[] = [
    {
        id: 0,
        name: 'Recycled kogtetochka',
        price: 541,
        color: 'turquoise',
        description: 'Really Electronic kogtetochka for Serengeti',
        material: 'Wooden'
    },
    {
        id: 1,
        name: 'Gorgeous kogtetochka',
        price: 1,
        color: 'orchid',
        description: 'Really Oriental kogtetochka for Balinese',
        material: 'Steel'
    }
]

jest.mock('axios')

describe('Тесты для корзины', () => {
    const ADD_TO_CART = 'Add to Cart'
    const CLEAR_CART = 'Clear shopping cart'

    beforeEach(() => {
        const mockedAxios = axios as jest.Mocked<typeof axios>;
        mockedAxios.get.mockImplementationOnce(() => Promise.resolve({
            status: 200,
            data: productsDetail[0]
        }))
        mockedAxios.get.mockImplementationOnce(() => Promise.resolve({
            status: 200,
            data: productsDetail[1]
        }))
    })

    afterEach(() => {
        jest.clearAllMocks()
        localStorage.clear();
    })

    it('в шапке рядом со ссылкой на корзину должно отображаться количество не повторяющихся товаров в ней', async () => {
        const ct1 = renderWithApp('/catalog/0')
        await waitFor(() => {
            const button = ct1
                .getByRole('button', {name: ADD_TO_CART})
            fireEvent.click(button)
        })

        const ct2 = renderWithApp('/catalog/1')
        await waitFor(async () => {
            const button = ct2
                .container
                .querySelector('.ProductDetails-AddToCart.btn.btn-primary.btn-lg')
            fireEvent.click(button)
        })

        const nameCount = 'Cart (2)'
        const cartCount = ct2.getByText(nameCount)
            .textContent

        expect(cartCount).toEqual(nameCount)
    })

    it('в корзине должна отображаться таблица с добавленными в нее товарами', async () => {
        const ct1 = renderWithApp('/catalog/0')
        await waitFor(() => {
            const button = ct1
                .getByRole('button', {name: ADD_TO_CART})
            fireEvent.click(button)
        })

        const ct2 = renderWithApp('/catalog/1')
        await waitFor(async () => {
            const button = ct2
                .container
                .querySelector('.ProductDetails-AddToCart.btn.btn-primary.btn-lg')
            fireEvent.click(button)
        })

        const {getAllByTestId} = renderWithApp('/cart')
        const countRow = getAllByTestId(/\d/).length
        expect(countRow).toEqual(2)
    })

    it('для каждого товара должны отображаться название, цена, количество , стоимость, а также должна отображаться общая сумма заказа', async () => {
        const ct1 = renderWithApp('/catalog/0')
        await waitFor(() => {
            const button = ct1
                .getByRole('button', {name: ADD_TO_CART})
            fireEvent.click(button)
        })

        const ct2 = renderWithApp('/catalog/1')
        await waitFor(async () => {
            const button = ct2
                .container
                .querySelector('.ProductDetails-AddToCart.btn.btn-primary.btn-lg')
            fireEvent.click(button)
        })

        const {getByTestId, getByText} = renderWithApp('/cart')

        const row1 = getByTestId(0)
        expect(row1.querySelector('.Cart-Name').textContent).toEqual(productsDetail[0].name)
        expect(row1.querySelector('.Cart-Price').textContent).toEqual('$' + productsDetail[0].price)
        expect(row1.querySelector('.Cart-Count').textContent).toEqual("1")
        expect(row1.querySelector('.Cart-Total').textContent).toEqual('$' + productsDetail[0].price)

        const row2 = getByTestId(1)
        expect(row2.querySelector('.Cart-Name').textContent).toEqual(productsDetail[1].name)
        expect(row2.querySelector('.Cart-Price').textContent).toEqual('$' + productsDetail[1].price)
        expect(row2.querySelector('.Cart-Count').textContent).toEqual("1")
        expect(row2.querySelector('.Cart-Total').textContent).toEqual('$' + productsDetail[1].price)

        expect(
            getByText('$' + (productsDetail[0].price + productsDetail[1].price))
                .textContent
        ).toEqual('$' + (productsDetail[0].price + productsDetail[1].price))
    })

    it('в корзине должна быть кнопка "очистить корзину", по нажатию на которую все товары должны удаляться', async () => {
        const ct1 = renderWithApp('/catalog/0')
        await waitFor(() => {
            const button = ct1
                .getByRole('button', {name: ADD_TO_CART})
            fireEvent.click(button)
        })

        const ct2 = renderWithApp('/catalog/1')
        await waitFor(async () => {
            const button = ct2
                .container
                .querySelector('.ProductDetails-AddToCart.btn.btn-primary.btn-lg')
            fireEvent.click(button)
        })

        const {queryByRole, getByText} = renderWithApp('/cart')

        const button = getByText(CLEAR_CART)
        fireEvent.click(button)
        expect(queryByRole('table')).toBeNull()
    })

    it('если корзина пустая, должна отображаться ссылка на каталог товаров', async () => {
        const ct1 = renderWithApp('/catalog/0')
        await waitFor(() => {
            const button = ct1
                .getByRole('button', {name: ADD_TO_CART})
            fireEvent.click(button)
        })

        const ct2 = renderWithApp('/catalog/1')
        await waitFor(async () => {
            const button = ct2
                .container
                .querySelector('.ProductDetails-AddToCart.btn.btn-primary.btn-lg')
            fireEvent.click(button)
        })

        const {getByTestId, getByText} = renderWithApp('/cart')

        const button = getByText(CLEAR_CART)
        fireEvent.click(button)
        const anchor = getByText('catalog')
        expect(anchor.nodeName).toEqual('A')
    })
})