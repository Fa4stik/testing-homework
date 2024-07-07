import {CartApi, ExampleApi} from "../../src/client/api";
import {initStore} from "../../src/client/store";
import React from "react";
import {render, waitFor, fireEvent, screen} from "@testing-library/react";
import {MemoryRouter, Route, Routes} from "react-router-dom";
import {Provider} from "react-redux";
import {Catalog} from "../../src/client/pages/Catalog";
import {Product as IProduct, ProductShortInfo} from "../../src/common/types";
import axios from "axios";
import {Product} from "../../src/client/pages/Product";
import {Cart} from "../../src/client/pages/Cart";
import {Application} from "../../src/client/Application";

const basename = '/hw/store';
const api = new ExampleApi(basename);

// resizeobserver: https://greenonsoftware.com/articles/testing/testing-and-mocking-resize-observer-in-java-script/

type Location = {
    pathname: string,
    routePath: string,
}

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

const products: ProductShortInfo[] = [
    {"id":0,"name":"Small kogtetochka","price":801},
    {"id":1,"name":"Recycled kogtetochka","price":541},
]

const productsDetail: IProduct = {
    id: 0,
    name: 'Recycled kogtetochka',
    price: 541,
    color: 'turquoise',
    description: 'Really Electronic kogtetochka for Serengeti',
    material: 'Wooden'
}

jest.mock('axios');

describe('Тесты для каталога', () => {
    const original = window.location;
    const reloadFn = () => {
        window.location.reload();
    };

    beforeAll(() => {
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { reload: jest.fn() },
        });
    });

    beforeEach(() => {
        const mockedAxios = axios as jest.Mocked<typeof axios>;
        mockedAxios.get.mockResolvedValue({
            data: products
        })
        localStorage.clear();
    })

    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        Object.defineProperty(window, 'location', { configurable: true, value: original });
    });

    it('В каталоге должны отображаться товары, список которых приходит с сервера', async () => {
        const { getAllByTestId, container } = renderWithApp('/catalog');

        await waitFor(() => {
            const productCount = getAllByTestId(/\d/i)
                .length/2
            expect(productCount).toEqual(products.length);
        });
    });

    it('Для каждого товара в каталоге отображается название, цена и ссылка на страницу с подробной информацией о товаре', async () => {
        const {getByText, getAllByTestId} = renderWithApp('/catalog')

        await waitFor(() => {
            // Проерка первого товара
            {
                const {name, price, id} = products[0]
                const titleQuery = getByText(name).textContent
                const priceQuery = getByText('$' + price).textContent
                const hrefQuery = getAllByTestId(id)[0]
                    .querySelector('a')
                    .getAttribute('href')

                expect([
                    titleQuery, priceQuery, hrefQuery
                ]).toEqual([name, '$' + price, '/hw/store/catalog/' + id])
            }
            // Проверка второго товара
            {
                const {name, price, id} = products[1]
                const titleQuery = getByText(name).textContent
                const priceQuery = getByText('$' + price).textContent
                const hrefQuery = getAllByTestId(id)[0]
                    .querySelector('a')
                    .getAttribute('href')

                expect([
                    titleQuery, priceQuery, hrefQuery
                ]).toEqual([name, '$' + price, '/hw/store/catalog/' + id])
            }
        })
    })

    it('На странице с подробной информацией отображаются: название товара, его описание, цена, цвет, материал и кнопка "добавить в корзину"', async () => {
        jest.clearAllMocks()
        const mockedAxios = axios as jest.Mocked<typeof axios>;
        mockedAxios.get.mockResolvedValue({
            data: productsDetail
        })

        const {getByText} = renderWithApp('/catalog/0')
        await waitFor(() => {
            const $price = '$' + productsDetail.price
            const nameButton = 'Add to Cart'

            const name = getByText(productsDetail.name).textContent
            const desc = getByText(productsDetail.description).textContent
            const price = getByText($price).textContent
            const color = getByText(productsDetail.color).textContent
            const material = getByText(productsDetail.material).textContent
            const button = getByText(nameButton)

            expect(name).toEqual(productsDetail.name)
            expect(desc).toEqual(productsDetail.description)
            expect(price).toEqual($price)
            expect(color).toEqual(productsDetail.color)
            expect(material).toEqual(productsDetail.material)
            expect(button.nodeName).toEqual('BUTTON')
            expect(button.textContent).toEqual(nameButton)
        })
    })

    it('если товар уже добавлен в корзину, в каталоге и на странице товара должно отображаться сообщение об этом', async () => {
        jest.clearAllMocks()
        const mockedAxios = axios as jest.Mocked<typeof axios>;
        mockedAxios.get.mockResolvedValue({
            data: productsDetail
        })

        const {getByText, getByRole} = renderWithApp('/catalog/0')
        await waitFor(() => {
            const nameButton = 'Add to Cart'
            const button = getByRole('button', {name: nameButton})
            fireEvent.click(button)
        })

        await waitFor(() => {
            const nameAddItem = 'Item in cart'
            const addedItem = getByText(nameAddItem)
            expect(addedItem.textContent).toEqual(nameAddItem)
        })
    })

    it('если товар уже добавлен в корзину, повторное нажатие кнопки "добавить в корзину" должно увеличивать его количество', async () => {
        jest.clearAllMocks()
        const mockedAxios = axios as jest.Mocked<typeof axios>;
        mockedAxios.get.mockResolvedValue({
            data: productsDetail
        })

        const {getByRole} = renderWithApp('/catalog/0')
        await waitFor(() => {
            const nameButton = 'Add to Cart'
            const button = getByRole('button', {name: nameButton})
            fireEvent.click(button)
            fireEvent.click(button)
        })
        const {container} = renderWithApp('/cart')
        const countProduct = container
            .querySelector('[data-testid]>.Cart-Count')
            .textContent
        expect(countProduct).toEqual('2')
    })

    it('содержимое корзины должно сохраняться между перезагрузками страницы', async () => {
        jest.clearAllMocks()
        const mockedAxios = axios as jest.Mocked<typeof axios>;
        mockedAxios.get.mockResolvedValue({
            data: productsDetail
        })

        const {getByRole} = renderWithApp('/catalog/0')
        await waitFor(() => {
            const nameButton = 'Add to Cart'
            const button = getByRole('button', {name: nameButton})
            fireEvent.click(button)
            fireEvent.click(button)
        })
        const {container} = renderWithApp('/cart')
        const countProduct = container
            .querySelector('[data-testid]>.Cart-Count')
            .textContent
        expect(countProduct).toEqual('2')
        reloadFn()
        expect(countProduct).toEqual('2')
    })
})